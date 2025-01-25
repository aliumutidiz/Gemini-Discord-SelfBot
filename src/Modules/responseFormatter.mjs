/** @format */

import { getFreeGamesString } from "../Extras/EpicGamesFreeGames.mjs";
import { waitForImageCreation } from "../Utils/generateImageUtils.mjs";
import { GetRandomImageUrl } from "../Extras/PrntScGetRandomImage.mjs";
import { IsAnAnomaly } from "./AnomalyCatcher.mjs";
import { addUserToBlacklist, removeUserFromBlacklist, isUserBlacklisted } from "../Utils/blacklistUtils.mjs";
import { removeUser } from "../Utils/userHistory.mjs";
import { textToSpeech } from "../Utils/textToSpeech.mjs";

import dotenv from "dotenv";
import { MessageAttachment } from "discord.js-selfbot-v13";
import { dirname } from "path";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
const AdminDiscordID = process.env.ADMIN_DISCORD_ID;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Waiting func
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Formats the provided answer by handling special placeholders and
 * performs asynchronous tasks such as fetching free games or generating an image.
 *
 * @param {string} answer - The original answer string that may contain placeholders.
 * @param {Object} message - The message object used for replying and reacting in the chat.
 * @returns {Promise<string>} The formatted answer with placeholders replaced, if applicable.
 */
export async function FormatAnswer(answer, message) {
	let formattedAnswer = answer;

	if (message.author.id === AdminDiscordID) {
		formattedAnswer = formattedAnswer.replace(`{${message.author.id}-admin}`, "");
		formattedAnswer = formattedAnswer.replace(`<@${message.author.id}-admin>`, `<@${message.author.id}>`);
	} else {
		formattedAnswer = formattedAnswer.replace(`{${message.author.id}}`, "");
	}

	// Check if the answer contains the {draw-image} placeholder
	const drawMatch = answer.match(/\{draw-image\}\[(.*?)\]/);

	// Handle the {epicgames-free-game} placeholder: Fetch free games list
	if (formattedAnswer.includes("{epicgames-free-game}")) {
		const gamesList = await getFreeGamesString();
		formattedAnswer = formattedAnswer.replace("{epicgames-free-game}", gamesList);
	}
	if (formattedAnswer.includes("{player-block}")) {
		const BannedUserID = answer.match(/\{player-block\}\[(.*?)\]/);
		await addUserToBlacklist(BannedUserID[1]);
		await message.react("☠️");
		formattedAnswer = formattedAnswer.replace(`{player-block}[${BannedUserID[1]}]`, "");
	}
	if (formattedAnswer.includes("{player-unblock}")) {
		const BannedUserID = answer.match(/\{player-unblock\}\[(.*?)\]/);
		await removeUserFromBlacklist(BannedUserID[1]);
		await message.react("🌹");
		formattedAnswer = formattedAnswer.replace(`{player-unblock}[${BannedUserID[1]}]`, "");
	}
	if (formattedAnswer.includes("{voice-message}")) {
		try {
			await message.react("👌");
		} catch (error) {
			// Hataları göz ardı et
			console.error("An error occurred, but it's being ignored.");
		}
		const re = /\{voice-message\}\[([a-zA-Z\-]+)\]/;
		const lang = formattedAnswer.match(re);
		const text = formattedAnswer.replace(`{voice-message}[${lang[1]}]`, "").replace("** **", "");

		textToSpeech(text, lang[1]);

		const attachment = new MessageAttachment(
			path.resolve(process.cwd(), "./src/Data/ses.mp3"), // path file
			"ses.ogg", // must be .ogg
			{
				waveform: "AAAAAAAAAAAA",
				duration_secs: 9999999, // any number you want
			}
		);
		await sleep(1000);
		await message.reply(
			(formattedAnswer =
				`\`Voice Message\`\n\`Lang: ${lang[1]}\`\n` +
				formattedAnswer.replace(`{voice-message}[${lang[1]}]`, "").replace("** **", ""))
		);
		await sleep(1500);

		console.log(typeof formattedAnswer); // formattedAnswer'ın türünü kontrol et
		console.log(formattedAnswer);

		return {
			files: [attachment],
			flags: "IS_VOICE_MESSAGE",
		};

		//formattedAnswer = `\`Voice Message\`\n\`Lang: ${lang[1]}\`` +formattedAnswer.replace(`{voice-message}[${lang[1]}]`, "").replace("** **", "");
	}
	// Handle the {prntsc-random-image} placeholder: Get PrntSc RandomImage Url
	if (formattedAnswer.includes("{prntsc-random-image}")) {
		// Start the image generation process asynchronously
		try {
			const targetSrc = "st.prntscr.com/2023/07/24/0635/img/0_173a7b_211be8ff.png";
			let prntScRanomImageUrl = "...";
			await GetRandomImageUrl(targetSrc)
				.then(async (src) => (prntScRanomImageUrl = src))
				.catch(async (error) => (prntScRanomImageUrl = error));
			formattedAnswer = formattedAnswer.replace("{prntsc-random-image}", `[*](${prntScRanomImageUrl})`);
		} catch (error) {
			formattedAnswer = formattedAnswer.replace(
				"{prntsc-random-image}",
				"{An unexpected error occurred while taking the picture.}"
			);
		}
	}

	// Handle the {draw-image} placeholder: Trigger image generation process
	else if (drawMatch && drawMatch[1]) {
		const extractedText = drawMatch[1]; // Extract the text inside the square brackets
		formattedAnswer = formattedAnswer.replace(`{draw-image}[${extractedText}]`, ""); // Remove {draw-image} from the answer

		// Start the image generation process asynchronously
		(async () => {
			try {
				// Simulate typing before sending the image URL
				await message.channel.sendTyping();

				// Generate the image URL using the extracted text
				const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(extractedText)}`;

				// React to the message with a thumbs-up emoji
				await message.react("👍");

				// Wait for the image creation to complete and get the result URL
				const resultUrl = await waitForImageCreation(imageUrl);

				setTimeout(async () => {
					// Reply with the result URL or an error message
					if (resultUrl) {
						await message.reply(`${resultUrl}`);
					} else {
						await message.reply("Error: Unable to generate the image.");
					}
				}, 2000);
			} catch (error) {
				// Handle any errors that occur during the image generation process
				await message.reply("Error: Something went wrong during image creation.");
				console.error(error);
			}

			console.log("Extracted text for image generation:", extractedText);
		})();

		// Log that the {draw-image} placeholder was found and image generation is in progress
		console.log("Image generation process started for {draw-image}.");
	}

	if (await IsAnAnomaly(formattedAnswer.replace())) {
		if (isUserBlacklisted(message.author.id)) {
			addUserToBlacklist(message.author.id);
			removeUser(message.channel.id, message.author.id);
			await message.react("💀");
			return "Anomaly detected: You have been blacklisted";
		}
	}

	// Return the formatted answer immediately without waiting for the asynchronous image creation
	return formattedAnswer;
}
