/** @format */

import fs from "fs";

// Dosya yolu
const dataFilePath = "./src/Data/chatHistories.json";

// Initialize an object to store chat histories for different channels
const chatHistories = {};

// Function to save the chat histories to a JSON file
async function saveChatHistories() {
	try {
		const data = JSON.stringify(chatHistories, null, 2); // Convert chat histories object to JSON string
		fs.writeFileSync(dataFilePath, data, "utf-8"); // Write JSON string to file
	} catch (error) {
		console.error("Error saving chat histories:", error); // Log any errors
	}
}

// Function to load chat histories from a JSON file
function loadChatHistories() {
	try {
		if (fs.existsSync(dataFilePath)) {
			// Check if the chat histories file exists
			const data = fs.readFileSync(dataFilePath, "utf-8"); // Read the file data

			if (data.trim() === "") {
				// Check if the file is empty
				console.log("Chat histories file is empty, starting fresh."); // Log message
				return;
			}

			try {
				Object.assign(chatHistories, JSON.parse(data)); // Parse JSON data and assign it to chatHistories
				console.log("Chat histories loaded successfully."); // Log success message
			} catch (jsonError) {
				console.error("Error parsing chat histories JSON:", jsonError); // Log JSON parsing errors
			}
		} else {
			console.log("No chat histories file found, starting fresh."); // Log message if file does not exist
		}
	} catch (error) {
		console.error("Error loading chat histories:", error); // Log any errors
	}
}

// Function to reset chat history for a specific channel
async function resetChatHistory(message) {
	// If chat history exists for the channel, reset it
	if (chatHistories[message.channel.id]) {
		chatHistories[message.channel.id] = []; // Reset the channel's chat history to an empty array
		console.log(`Chat history reset for channel: ${message.channel.id}`); // Log success message

		await message.react("👍"); // React a reply to confirm the reset

		// Save updated chat history to file
		fs.writeFileSync(dataFilePath, JSON.stringify(chatHistories, null, 2));
	} else {
		console.error(`No chat history found for channel: ${message.channel.id}`); // Log error if no history found
	}
}

// Function to clean up chat history by removing empty messages and duplicates
function cleanChatHistory(channelId) {
	if (!chatHistories[channelId]) {
		// Check if chat history exists for the channel
		console.warn(`No chat history found for channel: ${channelId}`); // Log warning if no history found
		return;
	}

	// Filter out messages with empty parts
	chatHistories[channelId] = chatHistories[channelId].filter((message) => {
		return message.parts && message.parts.length > 0 && message.parts[0].text.trim();
	});

	// Save the cleaned history
	saveChatHistories();

	let uniqueUserMessages = new Set(); // Use a Set to track unique user messages
	let cleanedChatHistory = []; // Array to hold the cleaned chat history

	// Loop through existing chat history for the channel
	chatHistories[channelId].forEach((message) => {
		const messageText = message.parts[0]?.text || ""; // Extract message text

		// If the message is from a user and is unique, add it twice
		if (message.role === "user") {
			if (!uniqueUserMessages.has(messageText)) {
				uniqueUserMessages.add(messageText);
				cleanedChatHistory.push(message);
				cleanedChatHistory.push(message); // Add the message twice
			}
		} else {
			// Add messages from the model role directly
			cleanedChatHistory.push(message);
		}
	});

	// Remove leading model messages if present
	while (cleanedChatHistory.length > 0 && cleanedChatHistory[0].role === "model") {
		cleanedChatHistory.shift(); // Remove the first message
	}

	// Update the chat history with cleaned data
	chatHistories[channelId] = cleanedChatHistory;
	fs.writeFileSync("chatHistories.json", JSON.stringify(chatHistories, null, 2)); // Save the updated chat history

	console.log(`Cleaned chat history for channel: ${channelId}`); // Log success message
}

// Function to update chat history with new messages
function updateChatHistory(channelId, role, text) {
	if (!chatHistories[channelId]) {
		// Initialize chat history for the channel if not present
		chatHistories[channelId] = [];
	}

	// If text is empty or only contains whitespace, do not add it to chat history
	if (!text.trim()) {
		console.warn("Empty or invalid content, not added to chatHistory.");
		return;
	}

	// Add the new message to chat history
	chatHistories[channelId].push({ role: role, parts: [{ text: text }] });

	// If the number of messages exceeds 100, remove the first two messages
	if (chatHistories[channelId].length > 100) {
		chatHistories[channelId].splice(0, 2);

		// Remove initial messages with role "model" if present
		while (chatHistories[channelId].length > 0 && chatHistories[channelId][0].role === "model") {
			chatHistories[channelId].shift();
		}
	}

	// Save the updated chat history to file
	saveChatHistories();
}

// Function to get chat history for a specific channel
function getChatHistory(channelId) {
	if (!chatHistories[channelId]) {
		// Initialize chat history for the channel if not present
		chatHistories[channelId] = [];
	}
	return chatHistories[channelId]; // Return the chat history
}

export { saveChatHistories, loadChatHistories, resetChatHistory, cleanChatHistory, updateChatHistory, getChatHistory };
