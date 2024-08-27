/** @format */

// gemini/imageProcessor.mjs

import { urlToBase64, splitMessage } from "../Utils/helpers.mjs";
import { getModel } from "./modelConfig.mjs";

async function processImageMessage(message, DiscordBotID) {
	const model = getModel();
	const attachments = message.attachments;
	const messageContent = `{${message.author.id}}` + message.content.replace(`<@${DiscordBotID}>`, "").trim();

	if (attachments.size > 0) {
		for (const [, attachment] of attachments) {
			if (attachment.height) {
				const imageUrl = attachment.url;
				const base64Image = await urlToBase64(imageUrl);
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
					const result = await model.generateContent([prompt, imagePart]);
					const responseText = result.response.text();
					const responseParts = splitMessage(responseText);

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

export { processImageMessage };
