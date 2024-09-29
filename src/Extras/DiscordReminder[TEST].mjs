/** @format */

// reminders.mjs
import { readFileSync, writeFileSync, existsSync } from "fs";

const filePath = "./reminders.json"; // Path to the JSON file

/**
 * Loads the reminders from the JSON file. If the file doesn't exist,
 * it returns an empty object.
 *
 * @returns {Object} The loaded reminders and unused IDs.
 */
export function loadReminders() {
	if (existsSync(filePath)) {
		try {
			const data = readFileSync(filePath, "utf8");
			return JSON.parse(data);
		} catch (error) {
			unusedIds: [];
		}
	}
	return { unusedIds: [] }; // If file doesn't exist, return an empty structure
}

/**
 * Saves the current reminders and unused IDs to the JSON file.
 *
 * @param {Object} data - The reminders and unused IDs data to save.
 */
export function saveReminders(data) {
	writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Generates a unique reminder ID for a user. It checks the unused IDs list first,
 * and if no unused IDs are available, it generates a new one based on the current
 * maximum reminder ID.
 *
 * @param {Object} data - The entire reminders data structure.
 * @param {String} userId - The ID of the user for whom to generate the reminder ID.
 * @returns {Number} A new unique reminder ID.
 */
function generateReminderId(data, userId) {
	// Check if there are any unused IDs available
	if (data.unusedIds && data.unusedIds.length > 0) {
		return data.unusedIds.shift(); // Use and remove the first available unused ID
	}

	// If no reminders exist for the user, start with ID 1
	if (data[userId] && data[userId].reminders.length > 0) {
		const reminderIds = data[userId].reminders.map((r) => parseInt(r.reminderId));
		return Math.max(...reminderIds) + 1; // Generate new ID by incrementing the highest existing ID
	}

	return 1; // If it's the first reminder for this user, the ID starts at 1
}

/**
 * Adds a new reminder for the specified user. The reminder includes the message,
 * date, time, and channel details. It also saves the reminder immediately to
 * the JSON file.
 *
 * @param {String} userId - The ID of the user.
 * @param {String} message - The reminder message.
 * @param {Number} year - The year of the reminder.
 * @param {Number} month - The month of the reminder.
 * @param {Number} day - The day of the reminder.
 * @param {Number} hour - The hour of the reminder.
 * @param {Number} minute - The minute of the reminder.
 * @param {String} channelId - The channel ID associated with the reminder.
 */
export function addReminder(userId, message, year, month, day, hour, minute, channelId) {
	const data = loadReminders();

	// Initialize the user's reminder list if not already present
	if (!data[userId]) {
		data[userId] = { reminders: [] };
	}

	// Generate a new reminder ID
	const reminderId = generateReminderId(data, userId);

	// Create the new reminder object
	const newReminder = {
		reminderId: reminderId.toString(),
		message,
		year,
		month,
		day,
		hour,
		minute,
		channelId,
	};

	// Add the reminder to the user's list and save the data to JSON
	data[userId].reminders.push(newReminder);
	saveReminders(data);

	console.log("Reminder added successfully.");
}

/**
 * Deletes a reminder for a user based on the reminder ID. The reminder is also
 * removed from the JSON file and the deleted reminder's ID is stored in the
 * unused IDs list for potential reuse.
 *
 * @param {String} userId - The ID of the user.
 * @param {String} reminderId - The ID of the reminder to delete.
 */
export function deleteReminder(userId, reminderId) {
	const data = loadReminders();

	if (data[userId]) {
		const reminders = data[userId].reminders;
		const index = reminders.findIndex((r) => r.reminderId === reminderId);

		if (index !== -1) {
			reminders.splice(index, 1); // Remove the reminder

			// Add the deleted reminder ID to the unused IDs list
			if (!data.unusedIds) {
				data.unusedIds = [];
			}
			data.unusedIds.push(parseInt(reminderId));

			saveReminders(data);
			console.log(`Reminder with ID ${reminderId} deleted successfully.`);
		} else {
			console.log("Reminder not found.");
		}
	} else {
		console.log("User not found.");
	}
}

/**
 * Initializes the reminder data when the project starts. This function loads
 * the reminders from the JSON file, ensuring that all reminders and unused
 * IDs are restored from the last session.
 *
 * @returns {Object} The loaded reminders data from the JSON file.
 */
export function initializeReminders() {
	const data = loadReminders();
	console.log("Reminders loaded successfully.");
	return data;
}

/**
 * Returns a formatted string of reminders for a specific user.
 * The format will include the reminder date, time, and message.
 *
 * @param {String} userId - The ID of the user whose reminders will be retrieved.
 * @returns {String} A formatted string with all reminders for the user.
 */
export function getFormattedReminders(userId) {
	const data = loadReminders(); // Load reminders from the JSON file

	if (!data[userId] || data[userId].reminders.length === 0) {
		return `User with ID ${userId} has no reminders.`;
	}

	// Start building the formatted string
	let reminderString = `Reminders for user ID ${userId}:\n`;

	data[userId].reminders.forEach((reminder) => {
		reminderString += `Reminder ID: ${reminder.reminderId}\n`;
		reminderString += `Date: ${reminder.day}/${reminder.month}/${reminder.year}\n`;
		reminderString += `Time: ${reminder.hour}:${reminder.minute}\n`;
		reminderString += `Message: ${reminder.message}\n`;
		reminderString += `Channel ID: ${reminder.channelId}\n`;
		reminderString += `---------------------------------\n`;
	});

	return reminderString;
}
