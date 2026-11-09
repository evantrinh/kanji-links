// word: { text, reading, meaning, kanji }
// index: { words, byKanji } where byKanji maps a kanji to words containing it

/** unique kanji in a string in order of appearance */
export const kanjiOf = (text) => [...new Set(text.match(/\p{Script=Han}/gu))];

/** entries: [{ text, reading?, meaning? }] */
export function buildIndex(entries) {
	const words = entries.map((entry) => ({ ...entry, kanji: kanjiOf(entry.text) }));
	const byKanji = new Map();

	for (const word of words) {
		for (const kanji of word.kanji) {
			if (!byKanji.has(kanji)) byKanji.set(kanji, []);
			byKanji.get(kanji).push(word);
		}
	}

	return { words, byKanji };
}

/** for each kanji in `word`, the other words containing it */
export function related(index, word) {
	return word.kanji.map((kanji) => ({
		kanji,
		words: index.byKanji.get(kanji).filter((other) => other !== word),
	}));
}

/**
 * words linked to their kanji, shaped for force-graph.
 * with `kanji`, only words containing one of them are included.
 */
export function toGraph(index, kanji) {
	const words = kanji ? [...new Set(kanji.flatMap((k) => index.byKanji.get(k)))] : index.words;
	const nodes = new Map();
	const links = [];
  
	for (const word of words) {
		const wordNode = { label: word.text, type: 'word', word };
		nodes.set(word, wordNode);
		for (const k of word.kanji) {
			if (!nodes.has(k)) nodes.set(k, { label: k, type: 'kanji' });
			links.push({ source: wordNode, target: nodes.get(k) });
		}
	}

	return { nodes: [...nodes.values()], links };
}
