/** @format */

import { genAI, safetySettings } from "./geminiClient.mjs";

// Varsayılan kişilik
let currentPersonality = "Auto";

const GeminiModel = "gemini-1.5-flash";
// Kişilik ayarlarını yapacak fonksiyon
export function setModelPersonality(personality) {
	currentPersonality = personality;
}

// AI modelini döndüren fonksiyon
export function getModel() {
	return genAI.getGenerativeModel({
		model: GeminiModel,
		systemInstruction: currentPersonality,
		safetySettings,
	});
}
