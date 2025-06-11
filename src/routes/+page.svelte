<script lang="ts">

    import SystemMessage from '$lib/components/SystemMessage.svelte';
    import { t, setLanguage } from '$lib/lang';
	import { chatStore } from '$lib/Stores/chatStore';
	import { currentLanguage } from '$lib/Stores/LangStores';
	import { parseSystemMessages } from '$lib/utils3';
	import { writable } from 'svelte/store';

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'tr', label: 'Türkçe' },
    ];

    function changeLanguage(lang: string) {
        setLanguage(lang);
        location.reload();
    }
    let newMessage = '';
    let isStreaming = writable(false); // Akış durumunu takip etmek için
	chatStore.isStreaming.subscribe((val)=> isStreaming.set(val));

    function sendMessage() {
		
        if (!newMessage.trim()) return;
        chatStore.addMessage(newMessage);
        newMessage = '';
        
    }

    function resetChat() {
        chatStore.reset(); // Sohbet geçmişini sıfırla
    }

    function toggleStreaming() {
        if (isStreaming) {
            chatStore.stopStreaming(); // Akışı durdur
        } 
    }
</script>

<div class="container">
    <header>
        🧠 {t('AppName')}

        <label for="language-select">{t("ChooseLanguage")} :</label>
        <select id="language-select" bind:value={$currentLanguage} on:change={(e) => changeLanguage(e.target.value)}>
            {#each languages as language}
                <option value={language.code}>{language.label}</option>
            {/each}
        </select>
    </header>

    <main>
        {#if $chatStore.length === 0}
            <div class="empty-chat-message">
                {t('StartNewChat')}
            </div>
        {:else}
            {#each $chatStore as msg (msg.id)}
                <div class="message-row {msg.sender === 'user' ? 'user' : 'bot'}">
                    <div class="bubble {msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}">
                        {#each parseSystemMessages(msg.content) as part}
                            {#if part.type === 'text'}
                                <span>{part.value}</span>
                            {:else}
                                <SystemMessage type={part.systemType} value={part.value} allText={part.allText} />
                            {/if}
                        {/each}
                    </div>
                </div>
            {/each}
        {/if}
    </main>

    <footer>
        <form on:submit|preventDefault={sendMessage}>
			<!-- Play/Stop Düğmesi -->
            {#if $isStreaming}
			<button class="play-stop-button" on:click={toggleStreaming}>⏹️</button>	
            {/if}
            <input type="text" placeholder={t('writeMessage')} bind:value={newMessage} />
            <button type="submit">{t('send')}</button>
			 <button class="reset-button" on:click={resetChat}>
            🔄 {t('ResetChat')}
        </button>

        </form>

        <!-- Sıfırlama Düğmesi -->
        
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
        min-height: 97vh;
    }

    header {
        background-color: white;
        padding: 1rem;
        text-align: center;
        font-weight: 600;
        font-size: 1.3rem;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        z-index: 10;
        position: sticky;
        top: 0;
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
        height: calc(100vh - 140px); /* Header ve footer yüksekliğini çıkar */
        box-sizing: border-box;
    }

    main::-webkit-scrollbar {
        width: 8px;
    }

    main::-webkit-scrollbar-thumb {
        background-color: #ccc;
        border-radius: 4px;
    }

    main::-webkit-scrollbar-track {
        background-color: transparent;
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
        padding: 0.4rem 0.5rem;
        max-width: 85%;
        border-radius: 18px;
        font-size: 0.95rem;
        line-height: 1.4;
        word-wrap: break-word;
    }

    .user-bubble {
        background-color: #a5a0ff;
        color: rgb(7, 6, 6);
        border-bottom-right-radius: 4px;
    }

    .bot-bubble {
        background-color: white;
        color: #000000;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        border-bottom-left-radius: 4px;
    }

    .user-bubble::after {
        content: '';
        position: absolute;
        right: -8px;
        bottom: 0;
        width: 0;
        height: 0;
        border-left: 8px solid #9995dd;
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
        z-index: 10;
        position: sticky;
        bottom: 0;
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

    .reset-button {
        background-color: #e54646;
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 9999px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
    }

    .reset-button:hover {
        background-color: #e63939;
    }

    .empty-chat-message {
        text-align: center;
        font-style: italic;
        color: #666;
        margin-top: 20px;
    }

    label {
        font-family: Arial, sans-serif;
        font-size: 1rem;
        font-weight: bold;
        color: #333;
        margin-left: 40px;
        margin-right: 10px;
        vertical-align: middle;
    }

    select {
        font-family: Arial, sans-serif;
        font-size: 1rem;
        padding: 0.5rem 1rem;
        border: 2px solid #ddd;
        border-radius: 8px;
        background-color: #fff;
        color: #333;
        cursor: pointer;
        transition: all 0.3s ease;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16'%3E%3Cpath fill='%23333' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.5rem center;
        background-size: 16px 16px;
    }

    select:hover {
        border-color: #aaa;
    }

    select:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
    }

    select:disabled {
        background-color: #f5f5f5;
        color: #aaa;
        cursor: not-allowed;
    }
</style>
