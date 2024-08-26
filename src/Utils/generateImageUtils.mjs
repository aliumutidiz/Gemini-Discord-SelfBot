/** @format */

import axios from "axios";

// Function to check if the image URL has been created
export async function checkImageStatus(imageUrl) {
	try {
		// Perform a GET request to the image URL
		const response = await axios.get(imageUrl);
		// If the status code is 200, the image has been created
		if (response.status === 200) {
			return true;
		}
	} catch (error) {
		// If there's an error, the image has not been created yet or another issue occurred
	}
	// Return false if the image is not created or an error occurred
	return false;
}

// Function to wait for the image creation by polling the status at regular intervals
export async function waitForImageCreation(imageUrl, interval = 5000, maxAttempts = 20) {
	let attempts = 0;
	while (attempts < maxAttempts) {
		// Check if the image has been created
		const imageCreated = await checkImageStatus(imageUrl);
		if (imageCreated) {
			// Return the image URL if it has been created
			return imageUrl;
		}
		attempts++;
		// Wait for the specified interval before checking again
		await new Promise((resolve) => setTimeout(resolve, interval));
	}
	// Return null if the image was not created within the maximum number of attempts
	return null;
}
