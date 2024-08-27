/** @format */

import { getChatHistory, saveChatHistories, cleanChatHistory } from "../Utils/chatHistory.mjs";
import { splitMessage } from "../Utils/helpers.mjs";
import { getModel } from "./modelConfig.mjs";

async function processMessage(message, DiscordBotID) {
	const model = getModel(); // Modelin global olarak güncellenmesi gerekiyorsa dışarıdan alınabilir
	const messageContent = `{${message.author.id}}` + message.content.replace(`<@${DiscordBotID}>`, "").trim();
	const channel = message.channel;
	const chatHistory = getChatHistory(channel.id);
	chatHistory.push({ role: "user", parts: [{ text: messageContent }] });

	const chat = model.startChat({
		history: chatHistory,
	});

	try {
		const result = await chat.sendMessage(messageContent);
		const responseText = result.response.text().trim();
		const responseParts = splitMessage(responseText);

		for (const part of responseParts) {
			await message.reply(part + "** ** ");
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
