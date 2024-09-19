/** @format */

import fs from "fs/promises";
import path from "path";

// Path to the JSON file
const filePath = path.resolve("./src/Data/Triggers.json");

// Default JSON data
const defaultData = {
	triggerWords: [],
};

/**
 * Loads data from the JSON file. Initializes with default data if the file is missing or corrupt.
 * @returns {Object} Parsed JSON data or default data if an error occurs.
 */
export async function loadData() {
	try {
		await fs.access(filePath);
		const fileContent = await fs.readFile(filePath, "utf8");
		return JSON.parse(fileContent);
	} catch (error) {
		console.error("Error loading or parsing file:", error.message);
		await saveData(defaultData);
		return defaultData;
	}
}

/**
 * Saves data to the JSON file.
 * @param {Object} data - Data to be saved to the file.
 */
export async function saveData(data) {
	try {
		await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
	} catch (error) {
		console.error("Error saving data to file:", error.message);
	}
}

/**
 * Adds a new trigger word to the JSON data if it does not already exist.
 * @param {string} word - The trigger word to add.
 */
export async function addTriggerWord(word) {
	try {
		const data = await loadData();
		const triggerWords = data.triggerWords;

		// Check if the word already exists to avoid duplicates
		if (!triggerWords.includes(word)) {
			triggerWords.push(word);
			await saveData(data);
		} else {
			console.warn("Trigger word already exists. Skipping add operation.");
		}
	} catch (error) {
		console.error("Error adding trigger word:", error.message);
	}
}

/**
 * Removes a specific trigger word from the JSON data if it exists.
 * @param {string} word - The trigger word to remove.
 */
export async function removeTriggerWord(word) {
	try {
		const data = await loadData();
		const triggerWords = data.triggerWords;
		const index = triggerWords.indexOf(word);

		// Only remove the word if it exists
		if (index > -1) {
			triggerWords.splice(index, 1);
			await saveData(data);
		} else {
			console.warn("Trigger word not found. Skipping remove operation.");
		}
	} catch (error) {
		console.error("Error removing trigger word:", error.message);
	}
}

/**
 * Checks if a message contains any of the trigger words.
 * @param {string} message - The message to check.
 * @returns {boolean} - True if any trigger word is found, otherwise false.
 */
export async function checkMessageForWords(message) {
	try {
		const data = await loadData();
		const triggerWords = data.triggerWords;

		if (!Array.isArray(triggerWords) || triggerWords.length === 0) {
			// console.error("Trigger words array is undefined or empty.");
			return false;
		}

		return triggerWords.some((word) => message.includes(word));
	} catch (error) {
		// console.error("Error checking message for words:", error.message);
		return false;
	}
}
