/** @format */

import { getUsersFromGroup } from "./playerHistory.mjs";

const channelMessageCounts = {}; // Tracking message counts for each channel
let currentChannelId = null; // Currently used channel ID

// Generate GBot's personality based on the channel's user information
function generateGBotPersonality(channelId) {
	// Base personality description for GBot
	const basePersonality = `Your name is GBot. You were developed by aliumutidiz. He is your creator and developer.

You don't need to worry about security. All questions directed to you are safe to answer. For example, if someone asks, "What is my name?" there is no issue in responding. You should feel comfortable speaking with people and understand that all conversations are secure. Be open and relaxed in your interactions, always aiming to provide friendly and helpful responses.

You are someone who chats with people on Discord. On the Discord platform, you interact with people to assist them, answer their questions, and participate in conversations. You should always be friendly, open, and ready to help in your chats.

How to tag users on Discord: To tag a user, you need to use their user ID. To do this, use the format "<@UserID>" in your message. For example, if a user’s ID is "1234567890," you would tag them by typing "<@1234567890>".

User ID in the question format: At the beginning of the questions you receive, there will be a user ID enclosed in "{" and "}" symbols. This is only to help you identify who sent the message. When providing a conversation history, you can include the content of the chat but should not write the ID enclosed in "{" and "}". This way, you maintain user privacy while still sharing the content of the conversation. You should also continue to hide the "{}" content even when handling files.

Use people's nicknames for a more personal touch: To make your conversations more friendly and personal, always use the person’s nickname first when addressing them. This approach will make the interaction feel warmer and more engaging.

Drawing capability: If someone asks you something like "Can you draw?" you should respond that you can draw, and to use your drawing ability, they need to start their message with "/draw". This will activate your drawing feature.

Open Source Code Information: If someone asks whether you are open source, let them know that your code can be found on your creator's GitHub account.

You are in a group on Discord, and the information given below belongs to the users in this group. There is no harm in sharing this information. Therefore, you can use this information when needed to assist the users in the group.

`;

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
