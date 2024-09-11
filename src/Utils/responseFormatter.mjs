/** @format */

import { getFreeGamesString } from "../Extras/EpicGamesFreeGames.mjs";

export async function FormatAnswer(answer) {
	let formattedAnswer = answer;

	if (formattedAnswer.includes("{epicgames-free-game}")) {
		const gamesList = await getFreeGamesString();
		formattedAnswer = formattedAnswer.replace("{epicgames-free-game}", gamesList);
	}

	return formattedAnswer;
}
