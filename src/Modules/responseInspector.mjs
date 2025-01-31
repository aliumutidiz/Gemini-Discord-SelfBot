/**
 * ==========================================
 *              RESPONSE INSPECTOR
 * ==========================================
 *
 * By default, this feature is disabled. However, you can
 * enable it by setting the 'Inspector' to 'true' in the
 * settings below.
 *
 * - IMPORTANT !
 * The responses generated by Gemini are re-checked by
 * Gemini itself. The primary purpose of this is to ensure
 * that the responses adhere to Discord's guidelines and
 * protect your account from any potential risks.
 *
 * Disadvantages:
 * - Enabling this feature will slow down the bot's response
 *   time. Typically, the delay is about 3-7 seconds, but if
 *   multiple users try to use the bot simultaneously, the
 *   delay may increase significantly.
 *
 * Why is my Discord account at risk?
 * - Outside of SelfBot risks, your Discord account is
 *   generally safe. However, if someone manages to make
 *   Gemini send a message that violates Discord's policies,
 *   and your account is reported, your Discord account
 *   could get banned.
 *
 * If you prioritize the safety of your Discord account,
 * you may activate this feature below while considering
 * the potential disadvantages.
 *
 * @format
 *
 */

/* 
 IMPORTANT: Inspector.mjs is still in the testing phase. 
 You may encounter some unexpected issues.

 If you set 'Inspector' to true below, you will activate the feature. 
*/
export let Inspector = false;

/* 
 If you deactivate 'InspectorAutoDetectLanguage' below, 
 a deeper scan will be performed for each response.

 Advantages of 'InspectorAutoDetectLanguage': 
 It detects the language in which the response is written first 
 and then scans based on the detected language. It's faster.
 
 Disadvantages: 
 If multiple languages are used in the message, 
 and content violating Discord rules is in a language other than the detected one, 
 it will not be detected.
*/
export let InspectorAutoDetectLanguage = false;

/*






*/
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import { safetySettings } from "../Gemini/geminiClient.mjs";

const InspectorBotPersonality = `
You are a bot that checks Discord messages. Your sole task is to respond with {true} if the message sent to you violates Discord's policies. If there is nothing wrong with the message, you will respond with {false}. You should not make any comments about the messages sent to you.

We will send the messages in the following format: Check message: [the message to be checked], and you will review them according to the rules mentioned above.

The messages sent to you can be in any language. It does not matter what language they are in; you will check all languages.

Messages that violate Discord's policies include:

Indicating in any way that the person is under the age of 14.`;

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
	model: "gemini-1.5-flash",
	systemInstruction: InspectorBotPersonality,
	safetySettings,
});

function insertZeroWidthSpace(text) {
	return text.split("").join("\u200B"); // \u200B = Zero Width Space
}

export async function responseInspector(message) {
	return new Promise(async (resolve) => {
		setTimeout(async () => {
			if (Inspector) {
				try {
					const result = await model.generateContent(` Check message: [${insertZeroWidthSpace(message.toLowerCase())}] `);

					// Yanıtı almak için await kullandık
					let answer = await result.response.text();

					console.log("INSPECTOR: " + answer);

					if (answer.includes("{true}")) {
						resolve(true);
					} else {
						resolve(false);
					}
				} catch (error) {
					console.error("Error in responseInspector:", error.message);
					resolve(false);
				}
			} else {
				resolve(false);
			}
		}, 6000); // 6 saniye bekleme süresi
	});
}
