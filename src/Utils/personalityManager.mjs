/** @format */

import { getUsersFromGroup } from "./playerHistory.mjs";
import { GetBasePersonality } from "../Config/CreateBasePersonality.mjs";

const channelMessageCounts = {}; // Tracking message counts for each channel
let currentChannelId = null; // Currently used channel ID

// Generate GBot's personality based on the channel's user information
function generateGBotPersonality(channelId) {
	// Base personality description for GBot
	const basePersonality = GetBasePersonality();
	// Fetch user information from the specified channel
	const users = getUsersFromGroup(channelId);

	let userInfo = "";
	if (users.length > 0) {
		userInfo = "Currently, you are in a group where the following members are present:\n";
		// Append each user's information to the userInfo string
		users.forEach((userString) => {
			userInfo += `${userString}\n`;
		});
	} else {
		userInfo = "Currently, you are in a group, but there are no members registered yet.";
	}

	// Combine base personality with user information to form the full personality
	const fullPersonality = `${basePersonality}\n\n${userInfo}`;

	return fullPersonality;
}

// Handle message to potentially update personality
function handleMessage(channelId) {
	let updated = false; // Variable to indicate whether the personality was updated

	// If the current channel has changed, update the personality
	if (channelId !== currentChannelId) {
		currentChannelId = channelId;
		channelMessageCounts[channelId] = 0; // Reset message count for the new channel
		const personality = generateGBotPersonality(channelId);
		updated = true; // Indicate that personality has been updated
		return [updated, personality];
	}

	// Initialize message count for the current channel if not already set
	if (!channelMessageCounts[channelId]) {
		channelMessageCounts[channelId] = 0;
	}

	// Increment the message count for the current channel
	channelMessageCounts[channelId] += 1;

	// Update personality every 5 messages
	if (channelMessageCounts[channelId] % 5 === 0) {
		const personality = generateGBotPersonality(channelId);
		updated = true; // Indicate that personality has been updated
		return [updated, personality];
	}

	// Return without updating the personality
	return [updated, null];
}

export { handleMessage };
