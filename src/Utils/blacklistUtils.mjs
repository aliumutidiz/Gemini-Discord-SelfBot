/** @format */

import fs from "fs/promises";

const filePath = "./src/Data/blacklist.json";

// Safely reads JSON file
async function readJsonFile() {
	try {
		const data = await fs.readFile(filePath, "utf8");
		// If the file is empty or invalid, return an empty array
		return data ? JSON.parse(data) : [];
	} catch (error) {
		// If the file doesn't exist or the JSON is malformed, return an empty array
		if (error.code === "ENOENT") {
			console.warn(`${filePath} not found, a new file will be created.`);
		} else {
			console.error("Error reading JSON file:", error);
		}
		return [];
	}
}

// Safely writes JSON file
async function writeJsonFile(data) {
	try {
		await fs.writeFile(filePath, JSON.stringify(data, null, 2));
	} catch (error) {
		console.error("Error writing JSON file:", error);
	}
}

// Adds a user to the blacklist
export async function addUserToBlacklist(user) {
	try {
		const blacklist = await readJsonFile();

		if (Array.isArray(blacklist)) {
			// Ensure the data is an array
			if (!blacklist.includes(user)) {
				blacklist.push(user);
				await writeJsonFile(blacklist);
				console.log(`${user} has been added to the blacklist.`);
			} else {
				console.log(`${user} is already in the blacklist.`);
			}
		} else {
			console.error("Blacklist data is not an array. Resetting blacklist.");
			await writeJsonFile([user]);
		}
	} catch (error) {
		console.error("An error occurred while adding a user:", error);
	}
}

// Removes a user from the blacklist
export async function removeUserFromBlacklist(user) {
	try {
		const blacklist = await readJsonFile();

		if (Array.isArray(blacklist)) {
			// Ensure the data is an array
			if (blacklist.includes(user)) {
				const updatedBlacklist = blacklist.filter((u) => u !== user);
				await writeJsonFile(updatedBlacklist);
				console.log(`${user} has been removed from the blacklist.`);
			} else {
				console.log(`${user} is not in the blacklist.`);
			}
		} else {
			console.error("Blacklist data is not an array. Cannot remove user.");
		}
	} catch (error) {
		console.error("An error occurred while removing a user:", error);
	}
}

// Checks if a user is in the blacklist
export async function isUserBlacklisted(user) {
	try {
		const blacklist = await readJsonFile();
		if (Array.isArray(blacklist)) {
			// Ensure the data is an array
			return blacklist.includes(user);
		} else {
			console.error("Blacklist data is not an array. Cannot check user.");
			return false;
		}
	} catch (error) {
		console.error("An error occurred while checking if a user is blacklisted:", error);
		return false;
	}
}
