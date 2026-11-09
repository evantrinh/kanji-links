const stripHtml = (text = '') => text.replace(/<[^>]*>/g, '').trim();

const toEntry = (text, reading, meaning) => ({
	text: stripHtml(text),
	reading: stripHtml(reading),
	meaning: stripHtml(meaning),
});

/** anki "notes in plain text" export, columns: word, reading, meaning */
export function parseTsv(tsv) {
	return tsv
		.split(/\r?\n/)
		.filter((line) => line && !line.startsWith('#'))
		.map((line) => toEntry(...line.split('\t')))
		.filter((entry) => entry.text);
}

/** notes from a running anki, through the ankiconnect add-on */
export async function fromAnkiConnect({ query, fields = ['Word', 'Reading', 'Meaning'], url = 'http://127.0.0.1:8765' }) {
	async function call(action, params) {
		const response = await fetch(url, { method: 'POST', body: JSON.stringify({ action, version: 6, params }) });
		const { result, error } = await response.json();
		if (error) throw new Error(error);
    
		return result;
	}

	const noteIds = await call('findNotes', { query });
	const notes = await call('notesInfo', { notes: noteIds });

	return notes
		.map((note) => toEntry(...fields.map((name) => note.fields[name]?.value)))
		.filter((entry) => entry.text);
}
