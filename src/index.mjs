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

// Load environment variables from a .env file
import dotenv from "dotenv";
dotenv.config();

// Initialize a new Discord client instance
export const client = new DiscordClient();

// Initialize the Google Generative AI instance with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Fetch the admin Discord user ID from environment variables
const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID;

// System instructions for the AI model, defining its behavior and personality
const GeminiModel = "gemini-1.5-flash";
// Initialize the AI model with system instructions
let model = genAI.getGenerativeModel({
	model: GeminiModel,
	systemInstruction: "Auto",
});

// Initialize an empty string to store the Discord bot ID
let DiscordBotID = "";
//#endregion

// Function to process messages and send replies
async function processMessage(message) {
	const messageContent = `{${message.author.id}}` + message.content.replace(`<@${DiscordBotID}>`, "").trim(); // Remove bot mention and trim the text
	const channel = message.channel;
	const chatHistory = getChatHistory(channel.id); // Get chat history
	chatHistory.push({ role: "user", parts: [{ text: messageContent }] }); // Add user message to chat history

	// Start chat and apply system instructions
	const chat = model.startChat({
		history: chatHistory,
	});

	try {
		const result = await chat.sendMessage(messageContent); // Send the message
		const responseText = result.response.text().trim(); // Get the response text

		// Split the response into chunks
		const responseParts = splitMessage(responseText);

		// Send each chunk sequentially
		for (const part of responseParts) {
			await message.reply(part + "** ** ");
		}

		// Save the response to chat history
		chatHistory.push({
			role: "model",
			parts: [{ text: responseText }],
		});

		console.log(
			"------------------------------------------------\n" +
				" • " +
				message.author.displayName +
				": " +
				messageContent +
				"\n • Answer: " +
				responseText +
				"\n • ChannelID : " +
				channel.id
		);

		// Save the chat histories
		saveChatHistories();
	} catch (error) {
		cleanChatHistory(message.channel.id);
		await message.reply("ERROR:" + error);
	}
}

// Function to process image messages
async function processImageMessage(message) {
	const attachments = message.attachments;
	const messageContent = `{${message.author.id}}` + message.content.replace(`<@${DiscordBotID}>`, "").trim();
	if (attachments.size > 0) {
		for (const [key, attachment] of attachments) {
			if (attachment.height) {
				const imageUrl = attachment.url;
				const base64Image = await urlToBase64(imageUrl); // Convert image URL to base64
				const imagePart = {
					inlineData: {
						data: base64Image,
						mimeType: attachment.contentType,
					},
				};

				let prompt = "what do you see";
				if (messageContent || !messageContent.trim().length === 0) {
					prompt = messageContent;
				}

				try {
					const result = await model.generateContent([prompt, imagePart]); // Generate content from image
					const responseText = result.response.text(); // Get the response text

					// Split the response into chunks
					const responseParts = splitMessage(responseText);

					// Send each chunk sequentially
					for (const part of responseParts) {
						await message.reply(part);
					}
				} catch (error) {
					console.error("Error generating content from image:", error);
					await message.reply("ERROR:" + error);
				}
			}
		}
	}
}

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
		model = genAI.getGenerativeModel({
			model: GeminiModel,
			systemInstruction: personality,
		});
	}

	// If the message is a mention of the bot with no attachments, reply with a question mark
	if (message.content === `<@${DiscordBotID}>` && message.attachments.size === 0) {
		await message.reply("?");
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
	else if (message.mentions.has(client.user) && messageContent.split(" ")[0] === "/draw") {
		try {
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
			await processImageMessage(message);
		} else {
			try {
				setTimeout(async () => {
					await processMessage(message);
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
