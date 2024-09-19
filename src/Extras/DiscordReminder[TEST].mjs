/** @format
 *
 *
 *
 *
 *  -----------------------------------------------------
 *
 *
 *
 *  -----------     THIS IS A TEST FILE      ------------
 *
 *
 * ------------------------------------------------------
 *
 *
 *
 *
 *
 *
 */

import fs from "fs";

let reminders = {}; // In-memory reminder storage
let clientInstance; // To store the Discord client instance for sending messages

// Function to load reminders from JSON and start checking
export function setupReminders(client) {
	clientInstance = client;

	// Load reminders from JSON file
	if (fs.existsSync("./reminders.json")) {
		const data = fs.readFileSync("./reminders.json");
		reminders = JSON.parse(data);
	}

	// Check reminders every second
	setInterval(() => {
		checkReminders();
	}, 1000);
}

// Add a new reminder and save it to the JSON file
function addReminder(userId, reminderData) {
	if (!reminders[userId]) {
		reminders[userId] = [];
	}

	const reminderId = Date.now().toString();
	reminderData.id = reminderId;

	reminders[userId].push(reminderData);
	saveReminders();

	return reminderId;
}

// Save all reminders to the JSON file
function saveReminders() {
	fs.writeFileSync("./reminders.json", JSON.stringify(reminders, null, 2));
}

// Remove a reminder by its ID
function removeReminder(userId, reminderId) {
	if (reminders[userId]) {
		reminders[userId] = reminders[userId].filter((rem) => rem.id !== reminderId);
		saveReminders();
	}
}

// Check reminders and trigger if any are due
function checkReminders() {
	const now = new Date();

	Object.keys(reminders).forEach((userId) => {
		reminders[userId].forEach((reminder) => {
			const reminderDate = new Date(reminder.year, reminder.month - 1, reminder.day, reminder.hour, reminder.minute);
			if (now >= reminderDate) {
				const channel = reminder.channelId ? clientInstance.channels.cache.get(reminder.channelId) : clientInstance.users.cache.get(userId);

				if (channel) {
					channel.send(reminder.message).catch((err) => console.error(err));
				}

				removeReminder(userId, reminder.id);
			}
		});
	});
}

// Create a new reminder
export function handleReminderCommand(userid, day, month, year, hour, minute, ChannelId) {
	const [day, month, year, hour, minute, ...reminderMessage] = args;

	const reminder = {
		day: parseInt(day),
		month: parseInt(month),
		year: parseInt(year),
		hour: parseInt(hour),
		minute: parseInt(minute),
		message: reminderMessage.join(" "),
		channelId: ChannelId === "null" ? null : ChannelId,
	};

	const reminderId = addReminder(userid, reminder);
	message.reply(`Reminder set with ID: ${reminderId}`);
}

// Remove a reminder by its ID
export function handleRemoveReminderCommand(message, args) {
	const reminderId = args[0];

	if (!reminderId) {
		return message.reply("Please provide a reminder ID. Usage: !remindremove <reminderID>");
	}

	removeReminder(message.author.id, reminderId);
	message.reply(`Reminder with ID: ${reminderId} has been removed.`);
}

// Function to get reminders for a specific user in a readable format
export function getUserReminders(userId) {
	if (!reminders[userId] || reminders[userId].length === 0) {
		return `No reminders found for user with ID: ${userId}`;
	}

	let reminderList = `Reminders for user with ID: ${userId}:\n`;

	reminders[userId].forEach((reminder) => {
		const reminderType = reminder.channelId ? `Message will be sent to channel ID: ${reminder.channelId}` : "ReminderType: DM";
		reminderList += `\n[ReminderID = ${reminder.id}, Reminder Message = "${reminder.message}", Date = ${reminder.day}/${reminder.month}/${reminder.year}, Time = ${reminder.hour}:${reminder.minute}, ${reminderType}]`;
	});

	return reminderList;
}
