# kanji-links

yea

- `core/` – library (`kanji-links`)
- `web/` – web view

```bash
npm install
npm run dev    # web view on http://localhost:5173
```

add stuff related to loading decks and anki and connecting stuff

```js
import { buildIndex, related, parseTsv } from 'kanji-links';

const index = buildIndex(parseTsv(text));
related(index, index.words[0]); // [{ kanji, words: [...other words with that kanji] }]
```
