<script lang="ts">
	import { t } from '$lib/lang';
	import Quiz from './ForLearn/Quiz.svelte';
	import SentenceBuilder from './ForLearn/SentenceBuilder.svelte';
	import SmartController from './SmartContol/SmartController.svelte';
	import ChatCalculate from './tools/ChatCalculate.svelte';
	import HideData from './tools/HideData.svelte';

	export let type: string;
	export let value: string;
	export let allText: string;
	console.log('type', type);

	let titleMap: Record<string, string> = {
		'chat-calculate': t('chatCalculate'),
		quiz: 'Quiz',
		'sentence-builder': t('sentenceBuilder'),
		'smart-control': 'Smart controller',
		'hide-data': 'Hide Data'
	};

	let title = titleMap[type] ?? t('smartWindow');

	let showRawText = false;
	function toggleRawText() {
		showRawText = !showRawText;
	}

	let showContent = true;
	function toggleContent() {
		showContent = !showContent;
	}
</script>

<div class="window-container">
	<div class="header">
		<button class="toggle-raw-text" on:click={toggleRawText}>
			{showRawText ? '📄' : '📄'}
		</button>
		<button class="toggle-content" on:click={toggleContent}>
			{showContent ? t('hideText') : t('showText')}
		</button>
		⚙️ {t('smartWindow')} - {title}
	</div>

	{#if showRawText}
		<div class="raw-text">
			<pre>{allText}</pre>
		</div>
	{/if}

	{#if showContent}
		<div class="content">
			{#if type === 'chat-calculate'}
				<ChatCalculate {value} />
			{:else if type === 'quiz'}
				<Quiz {value} />
			{:else if type === 'sentence-builder'}
				<SentenceBuilder {value} />
			{:else if type === 'smart-control'}
				<SmartController {value} />
			{:else if type === 'hide-data'}
				<HideData {value} />
			{:else}
				<div>{t('noSmartWindow')} <strong>{type}</strong></div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.window-container {
		margin: 0.25rem 0;
		border: 1px solid #d1d5db;
		border-radius: 12px;
		background: #ffffff;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
		overflow: hidden;
		font-family: sans-serif;
	}

	.header {
		background-color: #4f46e5;
		color: white;
		padding: 0.25rem 0.25rem;
		font-weight: bold;
		font-size: 1rem;
	}

	.content {
		padding: 0.25rem;
	}

	.toggle-raw-text {
		display: inline-block;
		margin-top: 0.4rem;
		padding: 0.4rem 0.4rem;
		background-color: rgb(96, 91, 194);
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.toggle-raw-text:hover {
		background-color: #433ab9;
	}

	.raw-text {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background-color: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		font-family: monospace;
	}

	.raw-text pre {
		white-space: pre-wrap; /* Uzun satırları böl */
		word-break: break-word; /* Kelimeleri bölerek kaydır */
		overflow-wrap: break-word; /* Büyük kelimeleri bölmek için */
		font-family: monospace; /* Yazı tipini koru */
	}
</style>
