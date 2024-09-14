/** @format */

// Generates a random numeric code with a default length of 6 digits
function generateRandomNumberCode(length = 6) {
	let result = "";
	for (let i = 0; i < length; i++) {
		result += Math.floor(Math.random() * 10); // Generate a random digit and append it to the result
	}
	return result;
}

/**
 * Attempts to find a random image URL from a given page source.
 * It generates a random code to form the URL and fetches the page HTML.
 * If a target image source (`targetSrc`) is found, it continues searching until
 * it finds an image source that does not match `targetSrc`.
 * @param {string} targetSrc - The image source to avoid.
 * @param {number} maxAttempts - The maximum number of attempts (default is 100).
 * @returns {string|null} - Returns the found image URL or a message if no valid image source is found.
 */
export async function GetRandomImageUrl(targetSrc, maxAttempts = 100) {
	let foundSrc = null; // Initialize found source as null

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			// Generate a random 6-digit numeric code
			const randomCode = generateRandomNumberCode();
			const pageUrl = `https://prnt.sc/${randomCode}`;

			console.log(`TRY: ${attempt + 1}: ${pageUrl}`);

			// Fetch the page
			const response = await fetch(pageUrl);
			if (!response.ok) {
				// If the page is not found, continue to the next attempt
				console.log(`Page not found: ${response.status}`);
				continue;
			}
			const html = await response.text();

			// Search for image src attributes within the HTML
			const regex = /<img[^>]+class="no-click screenshot-image"[^>]*src="([^"]+)"/g;
			let match;
			while ((match = regex.exec(html)) !== null) {
				const imageSrc = match[1]; // Get the image source URL
				if (imageSrc.includes(targetSrc)) {
					// If the target source is found, continue to the next attempt
					console.log(`Target src found: ${imageSrc}`);
					break;
				} else {
					// If a valid image source is found, store it
					foundSrc = imageSrc;
				}
			}

			// If an appropriate image source is found, return it
			if (foundSrc !== null) {
				return foundSrc;
			}
		} catch (error) {
			// Log any errors that occur during the fetch or processing
			console.error("An error occurred:", error);
		}
	}

	// If no appropriate image source is found after the maximum attempts
	if (foundSrc === null) {
		console.log("Target src not found.");
		return "Target src not found and no valid image source was found: " + foundSrc;
	}
	return foundSrc; // Return the found image source
}
