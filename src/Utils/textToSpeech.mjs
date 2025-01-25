import gtts from "gtts";
import fs from "fs";
import path from "path";

export async function textToSpeech(text, lang) {
	try {
		// Mevcut klasörün bir üst klasörüne geçip "Data" klasörünü hedefle
		const directory = path.resolve(process.cwd(), "./src/Data");
		console.log("-" + lang + "-");
		// Hedef dizini kontrol et ve yoksa oluştur
		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, { recursive: true });
		}

		// "Data" klasörüne dosyayı kaydet
		const filename = path.resolve(directory, "ses.mp3");
		const gttsInstance = new gtts(text, lang.toLowerCase());

		await new Promise((resolve, reject) => {
			gttsInstance.save(filename, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});

		console.log("Ses dosyası başarıyla oluşturuldu:", filename);
	} catch (error) {
		console.error("Ses dosyası oluşturulurken bir hata oluştu:", error);
		console.error("Ses dosyası oluşturulurken bir hata oluştu:");
		console.error("Hata Mesajı:", error.message || "Belirtilmeyen hata");
		console.error("Hata Detayları:", error);
	}
}
