// src/lib/chatStore.ts
import { t } from '$lib/lang';
import { lmStudioStreamAbort, streamLMStudioResponse } from '$lib/Services/lmStudioServiceWithAddFeatureApi';
// Eğer ollamaService'i kullanıyorsanız:
// import { ollamaStreamAbort, streamOllamaResponse } from '$lib/Services/ollamaService';
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment'; // 'browser' değişkenini import et

export type Message = {
    id: string;
    sender: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

// localStorage key'i
const CHAT_HISTORY_STORAGE_KEY = 'chat_history';

// Sohbet geçmişini localStorage'a kaydetme fonksiyonu
function saveChatHistory(messages: Message[]) {
    if (browser) { // Sadece tarayıcı ortamında çalıştır
        const serializableMessages = messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
        }));
        localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(serializableMessages));
    }
}

// Sohbet geçmişini localStorage'dan yükleme fonksiyonu
function loadChatHistory(): Message[] {
    if (browser) { // Sadece tarayıcı ortamında çalıştır
        const stored = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as (Omit<Message, 'timestamp'> & { timestamp: string })[];
                return parsed.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
            } catch (e) {
                console.error("Failed to parse chat history from localStorage", e);
                localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
                return [];
            }
        }
    }
    return []; // Sunucuda veya yükleme hatasında boş döner
}

function createChatStore() {
    // Başlangıç değerini localStorage'dan yükle
    // Bu çağrı artık browser kontrolü içeriyor.
    const initialMessages = loadChatHistory();
    const { subscribe, update, set } = writable<Message[]>(initialMessages);
    const isStreaming = writable(false);

    // Her mesaj değişikliğinde localStorage'a kaydetmek için subscribe ol
    // Bu abonelik, SvelteKit tarafından client-side'da çalışacak şekilde optimize edilir.
    // Ancak yine de içinde browser kontrolü yapmak iyi bir uygulamadır, özellikle eğer subscribe'ın hemen çalışması gerekiyorsa.
    // Burada `subscribe` doğrudan `saveChatHistory`'yi çağırdığı için sorun yok.
    subscribe(messages => {
        saveChatHistory(messages); // saveChatHistory zaten browser kontrolü içeriyor
    });

    return {
        subscribe,
        isStreaming,
        addDocumationMessage(documentMessage: string){
            let infoMessage = "🛠️smart-window🧲hide-data🧲title🌟"+t('commingDataInfoText')+"🚀"+documentMessage+"🛠️"
            const newMessage: Message = {
                id: crypto.randomUUID(),
                sender: 'assistant',
                content: infoMessage,
                timestamp: new Date(),
            };
            update((messages) => [...messages, newMessage]);
        },
        async addMessage(userMessage: string) {
            let fullUserContent = userMessage;

            const newMessage: Message = {
                id: crypto.randomUUID(),
                sender: 'user',
                content: fullUserContent,
                timestamp: new Date(),
            };
           
            update((messages) => [...messages, newMessage]);
            
            const conversationHistory = this.getConversationHistory();

            const botMessage: Message = {
                id: crypto.randomUUID(),
                sender: 'assistant',
                content: '',
                timestamp: new Date(),
            };

            update((messages) => [...messages, botMessage]);

            isStreaming.set(true);

            try {
                for await (const chunk of streamLMStudioResponse(conversationHistory)) {
                    update((messages) => {
                        const updatedMessages = [...messages];
                        const lastMessage = updatedMessages[updatedMessages.length - 1];

                        if (lastMessage && lastMessage.sender === 'assistant') {
                            lastMessage.content += chunk;
                        }
                        return updatedMessages;
                    });
                }
            } catch (error) {
                console.error('Streaming error:', error);
                update((messages) => {
                    const updatedMessages = [...messages];
                    const lastMessage = updatedMessages[updatedMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'assistant') {
                        lastMessage.content += `\n\n_Hata: Yanıt alınamadı. Detay: ${error.message || error}_`;
                    }
                    return updatedMessages;
                });
            } finally {
                isStreaming.set(false);
            }
        },

        getConversationHistory() {
            let history: { role: string; content: string }[] = [];
            const currentMessages = get({ subscribe });
            history = currentMessages.map((msg) => ({
                role: msg.sender,
                content: msg.content,
            }));
            return history;
        },

        reset() {
            set([]);
            isStreaming.set(false);
            if (browser) { // Sadece tarayıcı ortamında sil
                localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
            }
        },

        stopStreaming() {
            lmStudioStreamAbort();
            isStreaming.set(false);
        },
    };
}

export const chatStore = createChatStore();