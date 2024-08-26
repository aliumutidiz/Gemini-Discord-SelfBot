/** @format */

import fs from "fs";

// File path for the JSON data
const dataFilePath = "./src/Data/playerHistories.json";

// Read data from the JSON file or create a new one if it doesn't exist
function readData() {
	try {
		if (fs.existsSync(dataFilePath)) {
			const rawData = fs.readFileSync(dataFilePath, "utf-8").trim();
			return rawData ? JSON.parse(rawData) : {}; // Return an empty object if the file is empty
		}
		return {};
	} catch (error) {
		console.error("Failed to read file or JSON error:", error);
		return {};
	}
}

// Write data to the JSON file
function writeData(data) {
	try {
		fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
	} catch (error) {
		console.error("Failed to write file:", error);
	}
}

// Add a user to the data
function addUser(channelId, userId, username, nickname, messageContent) {
	const data = readData();

	if (!data[channelId]) {
		data[channelId] = {};
	}

	if (!data[channelId][userId]) {
		data[channelId][userId] = {
			username: username,
			nickname: nickname, // Add nickname for the new user
			messages: [],
			messageCount: 0,
		};
	} else {
		// Update nickname for an existing user
		data[channelId][userId].nickname = nickname;
	}

	// Add message content if it's not null
	if (messageContent) {
		// Check the length of the messages array
		if (data[channelId][userId].messages.length >= 15) {
			// If there are more than 15 messages, remove the oldest one
			data[channelId][userId].messages.shift(); // Remove the first message
		}
		// Add new message and increase the message count
		data[channelId][userId].messages.push(messageContent);
		data[channelId][userId].messageCount += 1;
	}

	writeData(data);
}

// Get users from a specific group (channel) and return in the desired format
function getUsersFromGroup(channelId) {
	const data = readData();
	const channelData = data[channelId];

	if (!channelData) {
		console.log(`Group (channel) not found: ${channelId}`);
		return [];
	}

	const userStrings = [];

	for (const userId in channelData) {
		const user = channelData[userId];
		const lastTenMessages = user.messages.slice(-10); // Get the last 10 messages
		const formattedMessages = lastTenMessages.map((msg) => `(${msg})`).join(" "); // Messages separated by parentheses

		const userString = `UserID: ${userId}, Username: ${user.username}, Nickname: ${user.nickname}, TotalMessageCount: ${user.messageCount}, Messages: ${formattedMessages} \n`;
		userStrings.push(userString);
	}

	return userStrings;
}

// Remove a user from the data
function removeUser(channelId, userId) {
	const data = readData();

	if (data[channelId] && data[channelId][userId]) {
		delete data[channelId][userId];
		writeData(data);
	}
}

// Remove a group (channel) from the data
function removeGroup(channelId) {
	const data = readData();

	if (data[channelId]) {
		delete data[channelId];
		writeData(data);
	}
}

export { addUser, removeUser, removeGroup, getUsersFromGroup };
