/** @format */

//#region IMPORTS & VARIABLES
// Import necessary modules and libraries
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addUser, removeUser, removeGroup, getUsersFromGroup } from "./Utils/userHistory.mjs";
import { handleMessage } from "./Utils/personalityManager.mjs";
import { checkImageStatus, waitForImageCreation } from "./Utils/generateImageUtils.mjs";
import { SetupRichPresence } from "./Config/SelfBotRichPresence.mjs";
import { saveChatHistories, loadChatHistories, resetChatHistory, cleanChatHistory, updateChatHistory, getChatHistory } from "./Utils/chatHistory.mjs";
import { addUserToBlacklist, removeUserFromBlacklist, isUserBlacklisted } from "./Utils/blacklistUtils.mjs";

// Import required classes from the discord.js-selfbot-v13 library
import { Client as DiscordClient } from "discord.js-selfbot-v13";

// Import Gemini-related modules
import { processMessage } from "./Gemini/messageProcessor.mjs";
import { processImageMessage } from "./Gemini/imageProcessor.mjs";
import { getModel, setModelPersonality } from "./Gemini/modelConfig.mjs";

// Load environment variables from a .env file
import dotenv from "dotenv";
dotenv.config();

// Initialize a new Discord client instance
export const client = new DiscordClient();

// Fetch the admin Discord user ID from environment variables
const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID;

// Initialize an empty string to store the Discord bot ID
let DiscordBotID = "";
//#endregion

// Message event handler
client.on("messageCreate", async (message) => {
	// Ignore messages from the bot itself
	if (message.author.id === DiscordBotID) return;
	if (message.author.bot) return;
	if (message.content.includes("@here") || message.content.includes("@everyone")) return;
	if (await isUserBlacklisted(message.channel.id)) return;
	if (message.mentions.has(client.user) && (await isUserBlacklisted(message.author.id))) {
		await message.react("⛔");
		return;
	}

	// Handle the message and check if the personality has been updated
	let updated;
	let personality;
	if (message.mentions.has(client.user) || message.channel.type === "DM") {
		[updated, personality] = handleMessage(message.channel.id);
	}

	// Update user data
	const channel = message.channel;
	const messageContent = message.content.replace(`<@${DiscordBotID}>`, "").trim();
	const channelId = message.channel.id;
	const userId = message.author.id;
	const username = message.author.username;
	const nickname = message.author.displayName;
	addUser(channelId, userId, username, nickname, messageContent);

	// If personality has been updated, create a new model with the updated personality
	if (updated) {
		console.log(`New personality for channel ${message.channel.id}:`);
		setModelPersonality(personality);
	}

	// If the message is a mention of the bot with no attachments, reply with a question mark
	if (message.content === `<@${DiscordBotID}>` && message.attachments.size === 0) {
		try {
			await message.channel.sendTyping();
			setTimeout(async () => {
				await message.reply("?");
			}, 1500);
		} catch (error) {}
		return;
	}
	// If the message is from the admin and the content is "clearchatdata", reset chat history
	else if (messageContent === "clearchatdata" && (message.channel.type === "DM" || message.author.id === ADMIN_DISCORD_ID)) {
		await resetChatHistory(message);
	}
	// If the message is from the admin and the content is "clearuserdata", remove group data
	else if (messageContent === "clearuserdata" && (message.channel.type === "DM" || message.author.id === ADMIN_DISCORD_ID)) {
		await removeGroup(channelId);
		await message.react("👍");
	}
	// If the message is from the admin and the content is "clearchanneldata", remove group data and reset chat history
	else if (messageContent === "clearchanneldata" && (message.channel.type === "DM" || message.author.id === ADMIN_DISCORD_ID)) {
		await removeGroup(channelId);
		await resetChatHistory(message);
	}
	// Black list
	else if (message.author.id === ADMIN_DISCORD_ID && messageContent.split(" ")[0] === "blacklist") {
		if (messageContent.split(" ")[1] === "add") {
			await addUserToBlacklist(messageContent.split(" ")[2]);
			await message.react("👍");
		} else if (messageContent.split(" ")[1] === "remove") {
			await removeUserFromBlacklist(messageContent.split(" ")[2]);
			await message.react("👍");
		}
	}
	// If the message mentions the bot and starts with "/draw", create an image from the prompt
	else if (messageContent.split(" ")[0] === "/draw" && (message.mentions.has(client.user) || message.channel.type === "DM")) {
		try {
			await message.channel.sendTyping();
			// Generate the image URL
			const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(messageContent.replace(`/draw`, ""))}`;

			await message.react("👍");

			// Wait for the image creation to complete
			const resultUrl = await waitForImageCreation(imageUrl);
			if (resultUrl) {
				await message.reply(`${resultUrl}`);
			} else {
				await message.reply("err. I'm unable to do this");
			}
		} catch (error) {
			await message.reply("Error");
			console.error(error);
		}
	}
	// If the message mentions the bot or is sent in a DM, process the message or attachments
	else if (message.mentions.has(client.user) || message.channel.type === "DM") {
		if (!messageContent && message.attachments.size === 0) return;
		if (message.attachments.size > 0) {
			await message.channel.sendTyping();
			await processImageMessage(message, DiscordBotID);
		} else {
			try {
				await message.channel.sendTyping();
				setTimeout(async () => {
					await processMessage(message, DiscordBotID);
				}, 500);
			} catch (error) {
				console.error("Error processing message:", error);
				cleanChatHistory(message.channel.id);
			}
		}
	}

	// For all other messages, update chat history
	else {
		const HistoryMessage =
			message.author.id === ADMIN_DISCORD_ID
				? `{${message.author.id}-admin}` + message.content.replace(`<@${DiscordBotID}>`, "").trim()
				: `{${message.author.id}}` + message.content.replace(`<@${DiscordBotID}>`, "").trim();
		updateChatHistory(channel.id, "user", HistoryMessage);
		updateChatHistory(channel.id, "user", HistoryMessage);
	}
});

//#region == uncaughtException and unhandledRejection handlers ==

// Catches all unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
	// You can add logic here to ignore the error or handle it
});

// Catches all uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	// You can add logic here to ignore the error or handle it
});

//#endregion

//#region == DISCORD BOT START & READY ==

// Event triggered when the bot is ready
client.on("ready", async () => {
	console.log(`Logged in as ${client.user.tag}`);
	DiscordBotID = client.user.id;
	// Load chat histories
	loadChatHistories();
});
// Custom status settings for the selfbot
await SetupRichPresence();

// Log in the bot to Discord
client.login(process.env.AUTH_KEY);
//#endregion
