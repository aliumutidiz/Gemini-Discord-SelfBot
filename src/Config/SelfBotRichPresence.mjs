/** @format */
import { Client as DiscordClient, RichPresence, CustomStatus } from "discord.js-selfbot-v13";
import { client } from "../index.mjs";
import dotenv from "dotenv";
dotenv.config();

// Function to set up Rich Presence and custom status
export async function SetupRichPresence() {
	client.on("ready", async () => {
		console.log(`${client.user.username} is ready (RichPresence)!`);

		// Get external asset URL for the large image in Rich Presence
		const getExtendURL = await RichPresence.getExternal(client, client.user.id, "https://i.imgur.com/sxCxYR6.jpeg");

		// Create and configure a new Rich Presence instance
		const status = new RichPresence(client)
			.setApplicationId(client.user.id) // Set the application ID (e.g., for a specific app or bot)
			.setType("STREAMING") // Set the activity
			.setURL("https://www.youtube.com/@maou0") // Setting URL changes the type
			.setState("Yes! I'm a bot.") // Set the status message
			.setName("GBot") // Set the activity name
			.setDetails("My name is GBot") // Set the activity details
			.setStartTimestamp(Date.now()) // Set the start time of the activity
			.setAssetsLargeImage(getExtendURL[0].external_asset_path) // Set the large image in Rich Presence
			.setAssetsLargeText("Do you want to talk to me? 😁") // Set the text for the large image
			.setPlatform("android") // Set the platform where the activity is occurring
			.addButton("GitHub", "https://github.com/aliumutidiz/Gemini-Discord-SelfBot"); // Add a button with a label and URL

		// Create and configure a new Custom Status instance
		const custom = new CustomStatus(client)
			.setEmoji("🤖") // Set the emoji for the custom status
			.setState("GBot"); // Set the custom status message

		// Set the presence of the bot to include both Rich Presence and custom status
		client.user.setPresence({ activities: [status, custom] });
	});
}
