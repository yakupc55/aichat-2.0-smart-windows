<script lang="ts">
    import { t } from '$lib/lang';
    import Quiz from './ForLearn/Quiz.svelte';
    import ChatCalculate from './tools/ChatCalculate.svelte';

    export let type: string;
    export let value: string;
    export let allText: string;

    // Anahtar: tüm smart-window türlerini burada eşleştiriyoruz
    let titleMap: Record<string, string> = {
        'chat-calculate': t('chatCalculate'),
        'quiz': "Quiz"
        // Diğer smart window türleri de buraya eklenecek
    };

    let title = titleMap[type] ?? 'Akıllı Pencere';

    // Ham metni göster/gizle durumu
    let showRawText = false;

    // Ham metni göster/gizle fonksiyonu
    function toggleRawText() {
        showRawText = !showRawText;
    }
</script>

<div class="window-container">
    <div class="header">  <button class="toggle-raw-text" on:click={toggleRawText}>
            {showRawText ? "📄" : "📄"}
        </button>
		⚙️ {t('smartWindow')} - {title}

		        <!-- Ham metin göster/gizle butonu -->
      
	</div>
	        <!-- Ham metin gösterimi -->
        {#if showRawText}
            <div class="raw-text">
                <pre>{allText}</pre>
            </div>
        {/if}
    
    <div class="content">
        {#if type === 'chat-calculate'}
            <ChatCalculate {value} />
        {:else if type === 'quiz'}
            <Quiz {value} />
        {:else}
            <div>{t("noSmartWindow")} <strong>{type}</strong></div>
        {/if}

</div>
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