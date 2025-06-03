
<script lang="ts">
	
	import SystemMessage from '$lib/components/SystemMessage.svelte';
	import { t,setLanguage} from '$lib/lang';
	import { mockMessages } from '$lib/mockMessages2En';
	import { currentLanguage } from '$lib/stores';
	import type { Message } from '$lib/types';
	// Mevcut dili almak için bir değişken tanımlayalım

	// Dillerin listesi
	const languages = [
		{ code: 'en', label: 'English' },
		{ code: 'tr', label: 'Türkçe' }
	];

	// Dil değiştirme işlevi
	function changeLanguage(lang: string) {
        setLanguage(lang); // Dili değiştir ve localStorage'a kaydet
       	location.reload(); // Sayfayı yenile
	}

	let messages: Message[] = mockMessages;
	let newMessage = '';

	function parseSystemMessages(content: string) {
		const regex = /\[\[smart-window]\[([^\]]+)]\[([\s\S]*?)]]/g;
		const parts: Array<{ type: 'text' | 'smart-window'; value: string; systemType?: string }> = [];

		let lastIndex = 0;
		let match;

		while ((match = regex.exec(content)) !== null) {
			if (match.index > lastIndex) {
				parts.push({ type: 'text', value: content.slice(lastIndex, match.index) });
			}

			parts.push({ type: 'smart-window', systemType: match[1], value: match[2] });
			lastIndex = regex.lastIndex;
		}

		if (lastIndex < content.length) {
			parts.push({ type: 'text', value: content.slice(lastIndex) });
		}

		return parts;
	}
</script>

<div class="container">
	<header>
		🧠 {t('AppName')}

		<label for="language-select">Dil Seçin:</label>
		<select id="language-select" bind:value={$currentLanguage} on:change={(e) => changeLanguage(e.target.value)}>
            {#each languages as language}
                <option value={language.code}>{language.label}</option>
            {/each}
        </select>
	</header>

	<main>
		{#each messages as msg (msg.id)}
			<div class="message-row {msg.sender === 'user' ? 'user' : 'bot'}">
				<div class="bubble {msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}">
					{#each parseSystemMessages(msg.content) as part}
						{#if part.type === 'text'}
							<span>{part.value}</span>
						{:else}
							<SystemMessage type={part.systemType} value={part.value} />
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</main>

	<footer>
		<form
			on:submit|preventDefault={() => {
				if (!newMessage.trim()) return;
				messages = [
					...messages,
					{
						id: crypto.randomUUID(),
						sender: 'user',
						content: newMessage,
						timestamp: new Date()
					}
				];
				newMessage = '';
			}}
		>
			<input type="text" placeholder={t('writeMessage')} bind:value={newMessage} />
			<button type="submit">{t('send')}</button>
		</form>
	</footer>
</div>

<style>
	body,
	html {
		margin: 0;
		padding: 0;
		font-family: 'Segoe UI', sans-serif;
		background: linear-gradient(to bottom, #e0e7ff, #c7d2fe);
		color: #333;
		height: 100%;
	}

	.container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		background-color: white;
		padding: 1rem;
		text-align: center;
		font-weight: 600;
		font-size: 1.3rem;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	main {
		flex: 1;
		overflow-y: auto;
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 700px;
		margin: 0 auto;
		width: 100%;
	}

	.message-row {
		display: flex;
	}

	.message-row.user {
		justify-content: flex-end;
	}

	.message-row.bot {
		justify-content: flex-start;
	}

	.bubble {
		position: relative;
		padding: 0.8rem 1rem;
		max-width: 75%;
		border-radius: 18px;
		font-size: 0.95rem;
		line-height: 1.4;
		word-wrap: break-word;
	}

	.user-bubble {
		background-color: #4f46e5;
		color: white;
		border-bottom-right-radius: 4px;
	}

	.bot-bubble {
		background-color: white;
		color: #333;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
		border-bottom-left-radius: 4px;
	}

	/* Tail styling */
	.user-bubble::after {
		content: '';
		position: absolute;
		right: -8px;
		bottom: 0;
		width: 0;
		height: 0;
		border-left: 8px solid #4f46e5;
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
	}

	.bot-bubble::after {
		content: '';
		position: absolute;
		left: -8px;
		bottom: 0;
		width: 0;
		height: 0;
		border-right: 8px solid white;
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
	}

	footer {
		background-color: white;
		padding: 1rem;
		box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
	}

	form {
		max-width: 700px;
		margin: 0 auto;
		display: flex;
		gap: 0.5rem;
	}

	input[type='text'] {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid #ccc;
		border-radius: 9999px;
		font-size: 1rem;
		outline: none;
		transition: border-color 0.2s;
	}

	input[type='text']:focus {
		border-color: #4f46e5;
	}

	button {
		background-color: #4f46e5;
		color: white;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	button:hover {
		background-color: #4338ca;
	}
	label {
		margin-left: 40px;
	}
	select {
		margin-left: 10px;
	}
</style>
