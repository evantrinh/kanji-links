import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kanjiOf, buildIndex, related, toGraph, parseTsv } from '../src/index.js';

const index = buildIndex([{ text: '憂鬱' }, { text: '鬱病' }, { text: '優しい' }, { text: 'ラーメン' }]);

test('kanjiOf keeps unique kanji only', () => {
	assert.deepEqual(kanjiOf('食べ物と食事'), ['食', '物', '事']);
	assert.deepEqual(kanjiOf('ラーメン'), []);
});

test('related lists other words sharing each kanji', () => {
	const [first] = index.words;
	const result = related(index, first);
	assert.deepEqual(result.map((r) => r.kanji), ['憂', '鬱']);
	assert.deepEqual(result[1].words.map((w) => w.text), ['鬱病']);
});

test('toGraph focuses on a kanji', () => {
	const { nodes, links } = toGraph(index, ['鬱']);
	assert.deepEqual(nodes.map((n) => n.label).sort(), ['憂', '憂鬱', '病', '鬱', '鬱病'].sort());
	assert.equal(links.length, 4);
});

test('parseTsv skips comments and strips html', () => {
	const tsv = '#separator:tab\n<b>憂鬱</b>\tゆううつ\tgloom\n';
	assert.deepEqual(parseTsv(tsv), [{ text: '憂鬱', reading: 'ゆううつ', meaning: 'gloom' }]);
});
