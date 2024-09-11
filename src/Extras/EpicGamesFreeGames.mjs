/** @format */

import axios from "axios";

let cachedGames = []; // Cache for games
let lastFetchTime = 0; // Time of last fetch
const cacheDuration = 1.5 * 60 * 60 * 1000; // 1.5 hours in milliseconds

// Function to fetch free games from Epic Games and return them as a string
export async function getFreeGamesString() {
	const currentTime = Date.now();

	// Check if cache is valid (within 1.5 hours)
	if (cachedGames.length > 0 && currentTime - lastFetchTime < cacheDuration) {
		console.log("Returning cached games from cache.");
		return cachedGames.join(", "); // Return cached games as a string
	}

	try {
		const response = await axios.get("https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions", {
			params: { country: "US", locale: "en-US" }, // Static options as per your request
			headers: { "Access-Control-Allow-Origin": "*" },
		});

		const data = response.data;
		const elements = data?.data?.Catalog?.searchStore?.elements || [];
		let freeGames = [];

		// Filter games with active promotions
		for (const game of elements) {
			if (game.promotions && game.promotions.promotionalOffers && game.promotions.promotionalOffers.length > 0) {
				freeGames.push(game.title);
			}
		}

		// Update cache and time of last fetch
		cachedGames = freeGames;
		lastFetchTime = currentTime;

		// Return games as a comma-separated string
		return freeGames.join(", ");
	} catch (error) {
		console.error("Error fetching free game promotions:", error.message);
		return "No free games available at the moment."; // Return a message if something goes wrong
	}
}
