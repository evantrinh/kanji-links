<script>
	import { onMount } from 'svelte';

	// data: { nodes, links } from toGraph, focus: kanji to highlight
	let { data, focus, showReadings, onselect } = $props();

	const KANJI_COLOR = '#d9480f';
	const SELECTED_COLOR = '#ff8c1a';
	const WORD_COLOR = '#333';

	let container;
	let width = $state(0);
	let height = $state(0);
	let graph = $state.raw();
	let fitOnStop = false;

	function charColor(char) {
		if (!/\p{Script=Han}/u.test(char)) return WORD_COLOR;
		return focus?.includes(char) ? SELECTED_COLOR : KANJI_COLOR;
	}

	const fontSize = (node) => (node.type === 'kanji' ? 18 : 11);

	// sets the node's font and returns its text width
	function measure(node, ctx) {
		ctx.font = `${fontSize(node)}px sans-serif`;
		return ctx.measureText(node.label).width;
	}

	// words are drawn as text so their kanji stay in reading order
	function drawNode(node, ctx) {
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		let x = node.x - measure(node, ctx) / 2;
		for (const char of node.label) {
			ctx.fillStyle = charColor(char);
			ctx.fillText(char, x, node.y);
			x += ctx.measureText(char).width;
		}

		if (showReadings && node.word?.reading) {
			ctx.font = '7px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillStyle = WORD_COLOR;
			ctx.fillText(node.word.reading, node.x, node.y - fontSize(node));
		}
	}

	// clickable area = the drawn text
	function paintHitbox(node, color, ctx) {
		const textWidth = measure(node, ctx);
		ctx.fillStyle = color;
		ctx.fillRect(node.x - textWidth / 2, node.y - fontSize(node) / 2, textWidth, fontSize(node));
	}

	onMount(async () => {
		const { default: ForceGraph } = await import('force-graph');
		// cast: force-graph types don't know our node shape
		const g = /** @type {any} */ (new ForceGraph(container))
			.nodeCanvasObject(drawNode)
			.nodePointerAreaPaint(paintHitbox)
			.onNodeClick((node) => onselect(node))
			.onEngineStop(() => {
				if (fitOnStop) g.zoomToFit(300, 40);
				fitOnStop = false;
			});
		g.d3Force('charge').strength(-100).distanceMax(100);
		graph = g;
	});

	$effect(() => {
		graph?.width(width).height(height);
	});

	$effect(() => {
		fitOnStop = true;
		graph?.graphData(data);
	});

	// setting the painter again makes force-graph repaint once
	$effect(() => {
		showReadings;
		graph?.nodeCanvasObject(drawNode);
	});
</script>

<div bind:this={container} bind:clientWidth={width} bind:clientHeight={height}></div>

<style>
	div {
		overflow: hidden;
	}
</style>
