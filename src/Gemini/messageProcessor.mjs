/** @format */

import { getChatHistory, saveChatHistories, cleanChatHistory } from "../Utils/chatHistory.mjs";
import { splitMessage } from "../Utils/helpers.mjs";
import { getModel } from "./modelConfig.mjs";
import { safetySettings } from "./geminiClient.mjs";
import { FormatAnswer } from "../Utils/responseFormatter.mjs";

import dotenv from "dotenv";
dotenv.config();
const AdminDiscordID = process.env.ADMIN_DISCORD_ID;

async function processMessage(message, DiscordBotID) {
	const model = getModel(); // Modelin global olarak güncellenmesi gerekiyorsa dışarıdan alınabilir
	const messageContent =
		message.author.id === AdminDiscordID
			? `{${message.author.id}-admin}` + message.content.replace(`<@${DiscordBotID}>`, "").trim()
			: `{${message.author.id}}` + message.content.replace(`<@${DiscordBotID}>`, "").trim();
	const channel = message.channel;
	const chatHistory = getChatHistory(channel.id);
	chatHistory.push({ role: "user", parts: [{ text: messageContent }] });

	const chat = model.startChat({
		history: chatHistory,
		safetySettings,
	});

	try {
		const result = await chat.sendMessage(messageContent);
		const responseText = result.response.text().trim();
		const responseParts = splitMessage(responseText);

		for (const part of responseParts) {
			await message.reply(await FormatAnswer(part + " ** ** "));
		}

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

		saveChatHistories();
	} catch (error) {
		cleanChatHistory(message.channel.id);
		await message.reply("ERROR:" + error);
	}
}

export { processMessage };
