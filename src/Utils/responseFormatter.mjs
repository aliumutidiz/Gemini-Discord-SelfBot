/** @format */

import { getFreeGamesString } from "../Extras/EpicGamesFreeGames.mjs";
import { waitForImageCreation } from "./generateImageUtils.mjs";
import { GetRandomImageUrl } from "../Extras/PrntScGetRandomImage.mjs";

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

	// Check if the answer contains the {draw-image} placeholder
	const drawMatch = answer.match(/\{draw-image\}\[(.*?)\]/);

	// Handle the {epicgames-free-game} placeholder: Fetch free games list
	if (formattedAnswer.includes("{epicgames-free-game}")) {
		const gamesList = await getFreeGamesString();
		formattedAnswer = formattedAnswer.replace("{epicgames-free-game}", gamesList);
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
			formattedAnswer = formattedAnswer.replace("{prntsc-random-image}", "{An unexpected error occurred while taking the picture.}");
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

	// Return the formatted answer immediately without waiting for the asynchronous image creation
	return formattedAnswer;
}
