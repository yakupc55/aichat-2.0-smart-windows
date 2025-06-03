<script lang="ts">

    import { t} from '$lib/lang';
	import ChatCalculate from './tools/ChatCalculate.svelte';
	export let type: string;
	export let value: string;

	// Anahtar: tüm smart-window türlerini burada eşleştiriyoruz

	let titleMap: Record<string, string> = {
        'chat-calculate': t('chatCalculate'),
		// Diğer smart window türleri de buraya eklenecek
	};

	let title = titleMap[type] ?? 'Akıllı Pencere';
</script>

<div class="window-container">
	<div class="header">⚙️ {t('smartWindow')} - {title}</div>
	<div class="content">
		{#if type === 'chat-calculate'}
			<ChatCalculate {value} />
		{:else}
			<div>Bu türde bir smart window yapılandırılmamış: <strong>{type}</strong></div>
		{/if}
	</div>
</div>

<style>
	.window-container {
		margin: 1rem 0;
		border: 1px solid #d1d5db;
		border-radius: 12px;
		background: #ffffff;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
		overflow: hidden;
		font-family: sans-serif;
	}

	.header {
		background-color: #4f46e5;
		color: white;
		padding: 0.75rem 1rem;
		font-weight: bold;
		font-size: 1rem;
	}

	.content {
		padding: 1rem;
	}
</style>
