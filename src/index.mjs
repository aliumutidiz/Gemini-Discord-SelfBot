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

// Map to maintain message queues for each channel
const channelQueues = new Map();
/**
 * Processes messages in the queue for a specific channel.
 * @param {string} channelId - The ID of the channel whose queue is being processed.
 */
async function processQueue(channelId) {
	const queue = channelQueues.get(channelId);
	if (!queue || queue.processing) return; // Return if no queue exists or if it is already being processed

	queue.processing = true;

	while (queue.messages.length > 0) {
		const { message, fn } = queue.messages.shift(); // Retrieve the next message and its associated function

		try {
			await fn(message); // Process the message
		} catch (error) {
			console.error("Error processing message:", error); // Log errors
		}
	}

	queue.processing = false;
}

/**
 * Adds a message and its associated function to the queue for a specific channel.
 * @param {string} channelId - The ID of the channel to which the message is added.
 * @param {Object} message - The message object.
 * @param {Function} fn - The function to be executed for the message.
 */
function addToQueue(channelId, message, fn) {
	if (!channelQueues.has(channelId)) {
		channelQueues.set(channelId, { messages: [], processing: false }); // Initialize the queue if it does not exist
	}

	const queue = channelQueues.get(channelId);
	queue.messages.push({ message, fn }); // Add the message and function to the queue
	processQueue(channelId); // Start processing the queue
}

// Message event handler
client.on("messageCreate", async (message) => {
	// Ignore messages from the bot itself
	if (message.author.id === DiscordBotID) return;
	if (message.author.bot) return;

	// Ignore messages containing mass mentions like @here or @everyone
	if (message.content.includes("@here") || message.content.includes("@everyone")) return;

	// Skip messages from blacklisted channels
	if (await isUserBlacklisted(message.channel.id)) return;

	// React with a block symbol if the bot is mentioned and the user is blacklisted
	if (message.mentions.has(client.user) && (await isUserBlacklisted(message.author.id))) {
		await message.react("⛔");
		return;
	}

	const channelId = message.channel.id;

	// Add message to the channel-specific queue for processing
	addToQueue(channelId, message, async (message) => {
		let updated;
		let personality;
		if (message.mentions.has(client.user) || message.channel.type === "DM") {
			[updated, personality] = handleMessage(message.channel.id);
		}

		// Update user data
		const messageContent = message.content.replace(`<@${DiscordBotID}>`, "").trim();
		const userId = message.author.id;
		const username = message.author.username;
		const nickname = message.author.displayName;
		addUser(channelId, userId, username, nickname, messageContent);

		// Update the bot's personality if needed
		if (updated) {
			console.log(`New personality for channel ${channelId}:`);
			setModelPersonality(personality);
		}

		// Respond to bot mentions with no attachments
		if (message.content === `<@${DiscordBotID}>` && message.attachments.size === 0) {
			try {
				await message.channel.sendTyping();
				setTimeout(async () => {
					await message.reply("?");
				}, 1500);
			} catch (error) {}
			return;
		}

		// Handle admin commands
		else if (messageContent === "clearchatdata" && (message.channel.type === "DM" || message.author.id === ADMIN_DISCORD_ID)) {
			await resetChatHistory(message);
		} else if (messageContent === "clearuserdata" && (message.channel.type === "DM" || message.author.id === ADMIN_DISCORD_ID)) {
			await removeGroup(channelId);
			await message.react("👍");
		} else if (messageContent === "clearchanneldata" && (message.channel.type === "DM" || message.author.id === ADMIN_DISCORD_ID)) {
			await removeGroup(channelId);
			await resetChatHistory(message);
		} else if (message.author.id === ADMIN_DISCORD_ID && messageContent.split(" ")[0] === "blacklist") {
			if (messageContent.split(" ")[1] === "add") {
				await addUserToBlacklist(messageContent.split(" ")[2]);
				await message.react("👍");
			} else if (messageContent.split(" ")[1] === "remove") {
				await removeUserFromBlacklist(messageContent.split(" ")[2]);
				await message.react("👍");
			}
		}

		// Handle image generation command
		else if (messageContent.split(" ")[0] === "/draw" && (message.mentions.has(client.user) || message.channel.type === "DM")) {
			try {
				await message.channel.sendTyping();
				const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(messageContent.replace(`/draw`, ""))}`;
				await message.react("👍");
				const resultUrl = await waitForImageCreation(imageUrl);
				if (resultUrl) {
					await message.reply(`${resultUrl}`);
				} else {
					await message.reply("Error: Unable to generate image");
				}
			} catch (error) {
				await message.reply("Error");
				console.error("Error generating image:", error);
			}
		}

		// Process messages in other cases
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
					}, 500); // Delay to handle rapid message bursts
				} catch (error) {
					console.error("Error processing message:", error);
					cleanChatHistory(message.channel.id);
				}
			}
		}

		// Update chat history for all other messages
		else {
			const HistoryMessage =
				message.author.id === ADMIN_DISCORD_ID
					? `{${message.author.id}-admin}` + message.content.replace(`<@${DiscordBotID}>`, "").trim()
					: `{${message.author.id}}` + message.content.replace(`<@${DiscordBotID}>`, "").trim();
			updateChatHistory(channelId, "user", HistoryMessage);
		}
	});
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
