/** @format */

//#region IMPORTS & VARIABLES
// Import necessary modules and libraries
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addUser, removeUser, removeGroup, getUsersFromGroup } from "./Utils/playerHistory.mjs";
import { handleMessage } from "./Utils/personalityManager.mjs";
import { checkImageStatus, waitForImageCreation } from "./Utils/generateImageUtils.mjs";
import { SetupRichPresence } from "./Config/SelfBotRichPresence.mjs";
import { urlToBase64, splitMessage } from "./Utils/helpers.mjs";
import { saveChatHistories, loadChatHistories, resetChatHistory, cleanChatHistory, updateChatHistory, getChatHistory } from "./Utils/chatHistory.mjs";

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

// Initialize the Google Generative AI instance with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Fetch the admin Discord user ID from environment variables
const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID;

// Initialize an empty string to store the Discord bot ID
let DiscordBotID = "";
//#endregion

// Message event handler
client.on("messageCreate", async (message) => {
	// Ignore messages from the bot itself
	if (message.author.id === DiscordBotID) return;

	// Handle the message and check if the personality has been updated
	const [updated, personality] = handleMessage(message.channel.id);
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
		await message.channel.sendTyping();
		setTimeout(async () => {
			await message.reply("?");
		}, 1500);

		return;
	}
	// If the message is from the admin and the content is "clearchatdata", reset chat history
	else if (message.author.id === ADMIN_DISCORD_ID && messageContent === "clearchatdata") {
		await resetChatHistory(message);
	}
	// If the message is from the admin and the content is "clearuserdata", remove group data and react with thumbs up
	else if (message.author.id === ADMIN_DISCORD_ID && messageContent === "clearuserdata") {
		await removeGroup(channelId);
		await message.react("👍");
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
		updateChatHistory(channel.id, "user", messageContent);
		updateChatHistory(channel.id, "user", messageContent);
	}
});

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
