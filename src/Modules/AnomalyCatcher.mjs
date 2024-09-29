/** @format */

import emojiRegex from "emoji-regex";
import { responseInspector, Inspector, InspectorAutoDetectLanguage } from "./responseInspector.mjs";
import { MessageActionRow } from "discord.js-selfbot-v13";
import langdetect from "langdetect";

export async function IsAnAnomaly(message) {
	return new Promise(async (resolve) => {
		const containsWrittenNumberResult = await containsWrittenNumber(message);
		setTimeout(
			async () => {
				// Mesaj uzunluğu kontrolü
				if (message.length > 8000) {
					resolve(true); // Mesaj 8000 karakterden uzun
				}

				// Emoji kontrolü
				const regex = emojiRegex();
				const emojis = [...message.matchAll(regex)]; // Tüm emojileri dizi olarak al
				if (emojis.length > 50) {
					resolve(true); // Mesajda 50'den fazla emoji var
				}

				if (Inspector) {
					if (containsNumberLessThan14(message) || containsWrittenNumberResult) {
						// 13 yaş kontrolü

						if (await responseInspector(message)) {
							resolve(true);
						}
					}
				}

				// No Anomaly
				resolve(false);
			},
			Inspector && (containsNumberLessThan14(message) || containsWrittenNumberResult) ? 1000 : 1
		);
	});
}

const numberDict = {
	en: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"],
	tr: ["bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz", "on", "on bir", "on iki", "on üç"],
	fr: ["un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize"],
	es: ["uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece"],
	de: ["eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "dreizehn"],
	ru: ["один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать"],
	it: ["uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci", "undici", "dodici", "tredici"],
	pt: ["um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze"],
	zh: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三"], // Çince
	ja: ["いち", "に", "さん", "し", "ご", "ろく", "しち", "はち", "きゅう", "じゅう", "じゅういち", "じゅうに", "じゅうさん"], // Japonca
	ko: ["일", "이", "삼", "사", "오", "육", "칠", "팔", "구", "십", "십일", "십이", "십삼"], // Korece
	ar: ["واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر"], // Arapça
	hi: ["एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ", "दस", "ग्यारह", "बारह", "तेरह"], // Hintçe
	bn: ["এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ", "এগারো", "বারো", "তেরো"], // Bengalce
	fa: ["یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه", "ده", "یازده", "دوازده", "سیزده"], // Farsça
	sv: ["ett", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio", "elva", "tolv", "tretton"], // İsveççe
	pl: ["jeden", "dwa", "trzy", "cztery", "pięć", "sześć", "siedem", "osiem", "dziewięć", "dziesięć", "jedenaście", "dwanaście", "trzynaście"], // Lehçe
	nl: ["een", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien", "elf", "twaalf", "dertien"], // Felemenkçe
	id: ["satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas", "dua belas", "tiga belas"], // Endonezce
	vi: ["một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười", "mười một", "mười hai", "mười ba"], // Vietnamca
	fi: ["yksi", "kaksi", "kolme", "neljä", "viisi", "kuusi", "seitsemän", "kahdeksan", "yhdeksän", "kymmenen", "yksitoista", "kaksitoista", "kolmetoista"], // Fince
	el: ["ένα", "δύο", "τρία", "τέσσερα", "πέντε", "έξι", "επτά", "οκτώ", "εννέα", "δέκα", "έντεκα", "δώδεκα", "δεκατρία"], // Yunanca
	th: ["หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ", "สิบเอ็ด", "สิบสอง", "สิบสาม"], // Tayca
	he: ["אחד", "שניים", "שלושה", "ארבעה", "חמישה", "שישה", "שבעה", "שמונה", "תשעה", "עשרה", "אחד עשר", "שניים עשר", "שלושה עשר"], // İbranice
	ms: ["satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "lapan", "sembilan", "sepuluh", "sebelas", "dua belas", "tiga belas"], // Malayca
	ta: ["ஒன்று", "இரண்டு", "மூன்று", "நான்கு", "ஐந்து", "ஆறு", "ஏழு", "எட்டு", "ஒன்பது", "பத்து", "பதினொன்று", "பன்னிரண்டு", "பதிமூன்று"], // Tamilce
	te: ["ఒకటి", "రెండు", "మూడు", "నాలుగు", "ఐదు", "ఆరు", "ఏడు", "ఎనిమిది", "తొమ్మిది", "పది", "పదకొండు", "పన్నెండు", "పదమూడు"], // Teluguca
	mr: ["एक", "दोन", "तीन", "चार", "पाच", "सहा", "सात", "आठ", "नऊ", "दहा", "अकरा", "बारा", "तेरा"], // Marathice
	ur: ["ایک", "دو", "تین", "چار", "پانچ", "چھ", "سات", "آٹھ", "نو", "دس", "گیارہ", "بارہ", "تیرہ"], // Urduca
	ro: ["unu", "doi", "trei", "patru", "cinci", "șase", "șapte", "opt", "nouă", "zece", "unsprezece", "doisprezece", "treisprezece"], // Romence
	bg: ["едно", "две", "три", "четири", "пет", "шест", "седем", "осем", "девет", "десет", "единадесет", "дванадесет", "тринадесет"], // Bulgarca
	cs: ["jeden", "dva", "tři", "čtyři", "pět", "šest", "sedm", "osm", "devět", "deset", "jedenáct", "dvanáct", "třináct"], // Çekçe
	da: ["en", "to", "tre", "fire", "fem", "seks", "syv", "otte", "ni", "ti", "elleve", "tolv", "tretten"], // Danca
	hu: ["egy", "kettő", "három", "négy", "öt", "hat", "hét", "nyolc", "kilenc", "tíz", "tizenegy", "tizenkettő", "tizenhárom"], // Macarca
	uk: ["один", "два", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять", "десять", "одинадцять", "дванадцять", "тринадцять"], // Ukraynaca
	no: ["en", "to", "tre", "fire", "fem", "seks", "sju", "åtte", "ni", "ti", "elleve", "tolv", "tretten"], // Norveççe
	hr: ["jedan", "dva", "tri", "četiri", "pet", "šest", "sedam", "osam", "devet", "deset", "jedanaest", "dvanaest", "trinaest"], // Hırvatça
	sk: ["jeden", "dva", "tri", "štyri", "päť", "šesť", "sedem", "osem", "deväť", "desať", "jedenásť", "dvanásť", "trinásť"], // Slovakça
	sr: ["један", "два", "три", "четири", "пет", "шест", "седам", "осам", "девет", "десет", "једанаест", "дванаест", "тринаест"], // Sırpça (Kiril)
	lt: ["vienas", "du", "trys", "keturi", "penki", "šeši", "septyni", "aštuoni", "devyni", "dešimt", "vienuolika", "dvylika", "trylika"], // Litvanca
	et: ["üks", "kaks", "kolm", "neli", "viis", "kuus", "seitse", "kaheksa", "üheksa", "kümme", "üksteist", "kaksteist", "kolmteist"], // Estonca
	lv: ["viens", "divi", "trīs", "četri", "pieci", "seši", "septiņi", "astoņi", "deviņi", "desmit", "vienpadsmit", "divpadsmit", "trīspadsmit"], // Letonca
};

function containsNumberLessThan14(text) {
	const numbers = text.match(/\d+/g);

	if (numbers) {
		return numbers.some((num) => parseInt(num) < 14);
	}

	return false;
}

// Detect language
async function detectLanguage(text) {
	return new Promise((resolve) => {
		const detected = langdetect.detect(text);
		resolve(detected.length > 0 ? detected[0].lang : null);
	});
}

// Check if there are written numbers
async function containsWrittenNumber(text) {
	return new Promise(async (resolve) => {
		if (InspectorAutoDetectLanguage) {
			const detectedLanguage = await detectLanguage(text);
			console.log("DETECTED LANGUAGE: " + detectedLanguage);
			// Return false if language detection fails
			if (!detectedLanguage || detectedLanguage === "und") {
				resolve(false);
			}

			// Check if the detected language has a number list
			if (numberDict[detectedLanguage]) {
				const lowerCaseText = text.toLowerCase();
				// Compare with the numbers in that language
				for (let number of numberDict[detectedLanguage]) {
					if (lowerCaseText.includes(number)) {
						console.log("containsWrittenNumber: TRUE");
						resolve(true);
					}
				}
			}

			resolve(false);
		} else {
			const textWords = text.toLowerCase().split(/\s+/);

			// Her dildeki kelimeleri kontrol et
			for (const language in numberDict) {
				for (const word of numberDict[language]) {
					if (textWords.includes(word.toLowerCase())) {
						resolve(true);
					}
				}
			}

			resolve(false);
		}
	});
}
