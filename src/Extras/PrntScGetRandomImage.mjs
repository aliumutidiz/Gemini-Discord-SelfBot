/** @format */

function generateRandomNumberCode(length = 6) {
	let result = "";
	for (let i = 0; i < length; i++) {
		result += Math.floor(Math.random() * 10);
	}
	return result;
}

export async function GetRandomImageUrl(targetSrc, maxAttempts = 100) {
	let foundSrc = null;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			// Rastgele 6 haneli sayısal kod üret
			const randomCode = generateRandomNumberCode();
			const pageUrl = `https://prnt.sc/${randomCode}`;

			console.log(`Deneme ${attempt + 1}: ${pageUrl}`);

			// Sayfayı indir
			const response = await fetch(pageUrl);
			if (!response.ok) {
				console.log(`Sayfa bulunamadı: ${response.status}`);
				continue;
			}
			const html = await response.text();

			// Resim src'lerini bulma
			const regex = /<img[^>]+class="no-click screenshot-image"[^>]*src="([^"]+)"/g;
			let match;
			while ((match = regex.exec(html)) !== null) {
				const imageSrc = match[1];
				if (imageSrc.includes(targetSrc)) {
					// Belirtilen src bulunursa tekrar dene
					console.log(`Hedef src bulundu: ${imageSrc}`);
					break;
				} else {
					// Belirtilen src bulunmazsa döndür
					foundSrc = imageSrc;
				}
			}

			if (foundSrc !== null) {
				return foundSrc; // İlk uygun src döndür
			}
		} catch (error) {
			console.error("Bir hata oluştu:", error);
		}
	}

	// Belirtilen src bulunamazsa döndürülen ilk uygun src
	if (foundSrc === null) {
		console.log("Belirtilen src bulunamadı.");
		return "Belirtilen src bulunamadı ve uygun bir src döndürüldü: " + foundSrc;
	}
	return foundSrc;
}
