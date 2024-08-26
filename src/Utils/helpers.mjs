/** @format */

import fetch from "node-fetch";

// Function to download an image from a URL and convert it to base64 format
export async function urlToBase64(url) {
	const response = await fetch(url); // Fetch the image from the URL
	const buffer = await response.buffer(); // Convert the response to a buffer
	return buffer.toString("base64"); // Convert buffer to base64 string
}

// Function to split long texts into 2000-character chunks
export function splitMessage(text) {
	const MAX_LENGTH = 1999; // Maximum length
	const parts = []; // Array to hold the chunks

	while (text.length > MAX_LENGTH) {
		let chunk = text.slice(0, MAX_LENGTH); // Get the first chunk of text
		const lastNewLine = chunk.lastIndexOf("\n"); // Find the position of the last newline character

		// If the 2000th character is in the middle of a word, cut at the last space
		if (lastNewLine > 0) {
			chunk = text.slice(0, lastNewLine);
		}

		parts.push(chunk); // Add the chunk to the array
		text = text.slice(chunk.length); // Update the remaining text
	}

	parts.push(text); // Add the last remaining part

	return parts; // Return the chunks
}
