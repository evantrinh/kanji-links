<script>
	import { buildIndex, related, toGraph, parseTsv, fromAnkiConnect } from 'kanji-links';
	import Graph from '#lib/Graph.svelte';
	import { sample } from '#lib/sample.js';

	let index = $state.raw(buildIndex(parseTsv(sample)));
	let selected = $state.raw(null); // { kanji } or { word }
	let search = $state('');
	let ankiQuery = $state('deck:Japanese');
	let ankiFields = $state('Word, Reading, Meaning');
	let error = $state('');
	let showReadings = $state(true);

	// kanji to highlight, undefined when nothing is selected
	let focus = $derived(selected?.kanji ? [selected.kanji] : selected?.word?.kanji);

	// graph of the selection's words, or the whole deck when nothing is selected
	let graphData = $derived(toGraph(index, focus));

	let kanjiList = $derived(
		[...index.byKanji]
			.filter(([kanji]) => !search || search.includes(kanji))
			.sort((a, b) => b[1].length - a[1].length)
	);
	let wordList = $derived(
		search ? index.words.filter((w) => [w.text, w.reading, w.meaning].some((s) => s?.includes(search))) : []
	);

	function load(entries) {
		index = buildIndex(entries);
		selected = null;
	}

	async function loadAnki() {
		try {
			const fields = ankiFields.split(',').map((f) => f.trim());
			load(await fromAnkiConnect({ query: ankiQuery, fields }));
			error = '';
		} catch (e) {
			error = `${e.message} (is Anki open, and is ${location.origin} in AnkiConnect's webCorsOriginList?)`;
		}
	}

	async function loadFile(event) {
		load(parseTsv(await event.target.files[0].text()));
	}

	function selectNode(node) {
		selected = node.type === 'kanji' ? { kanji: node.label } : { word: node.word };
	}
</script>

{#snippet wordText(w)}
	<ruby>{w.text}<rt>{w.reading}</rt></ruby>
{/snippet}

{#snippet wordButton(w)}
	<button onclick={() => (selected = { word: w })}>{@render wordText(w)}</button>
	<small>{w.meaning}</small>
{/snippet}

<main>
	<aside>
		<input placeholder="search kanji / word / meaning" bind:value={search} />
		<details>
			<summary>load deck</summary>
			<input bind:value={ankiQuery} placeholder="Anki search" />
			<input bind:value={ankiFields} placeholder="word, reading, meaning fields" />
			<button onclick={loadAnki}>load from AnkiConnect</button>
			<input type="file" accept=".txt,.tsv" onchange={loadFile} />
			{#if error}<p class="error">{error}</p>{/if}
		</details>
		<label><input type="checkbox" bind:checked={showReadings} /> graph readings</label>
		<p>{index.words.length} words, {index.byKanji.size} kanji</p>
		<ul>
			{#each wordList as w}<li>{@render wordButton(w)}</li>{/each}
			{#each kanjiList as [k, words]}
				<li><button onclick={() => (selected = { kanji: k })}>{k}</button> <small>{words.length}</small></li>
			{/each}
		</ul>
	</aside>

	<section>
		{#if selected?.word}
			<h2>{@render wordText(selected.word)}</h2>
			<p>{selected.word.meaning}</p>
			{#each related(index, selected.word) as { kanji, words }}
				<h3><button onclick={() => (selected = { kanji })}>{kanji}</button></h3>
				<ul>
					{#each words as w}<li>{@render wordButton(w)}</li>{:else}<li><small>only seen in this word</small></li>{/each}
				</ul>
			{/each}
		{:else if selected?.kanji}
			<h2>{selected.kanji}</h2>
			<ul>
				{#each index.byKanji.get(selected.kanji) as w}<li>{@render wordButton(w)}</li>{/each}
			</ul>
		{:else}
			<p>pick a kanji or word, or click a node in the graph</p>
		{/if}
	</section>

	<Graph data={graphData} {focus} {showReadings} onselect={selectNode} />
</main>

<style>
	:global(body) {
		margin: 0;
	}
	main {
		display: grid;
		grid-template-columns: 260px minmax(0, 1fr) minmax(0, 1.4fr);
		height: 100vh;
		font-family: sans-serif;
	}
	aside,
	section {
		overflow: auto;
		padding: 0.5rem;
	}
	ul {
		list-style: none;
		padding: 0;
	}
	input:not([type='checkbox']) {
		display: block;
		width: 100%;
		box-sizing: border-box;
	}
	.error {
		color: crimson;
	}
</style>
