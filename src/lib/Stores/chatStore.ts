// src/lib/chatStore.ts
import { ollamaStreamAbort, streamOllamaResponse } from '$lib/Services/ollamaService';
import { writable } from 'svelte/store';
export type Message = {
    id: string;
    sender: 'user' | 'bot';
    content: string;
    timestamp: Date;
};

function createChatStore() {
    const { subscribe, update,set } = writable<Message[]>([]);

    return {
        subscribe,

        async addMessage(userMessage: string) {
            const newMessage: Message = {
                id: crypto.randomUUID(),
                sender: 'user',
                content: userMessage,
                timestamp: new Date(),
            };

            // Kullanıcı mesajını ekleyelim
            update((messages) => [...messages, newMessage]);

            // Bot'un yanıtını alalım
            const conversationHistory = [
                ...this.getConversationHistory(),
                { role: 'user', content: userMessage },
            ];

            // Bot mesajını oluştur
            const botMessage: Message = {
                id: crypto.randomUUID(),
                sender: 'bot',
                content: '',
                timestamp: new Date(),
            };

            // Bot mesajını mağazaya ekleyelim (başlangıçta boş içerik)
            update((messages) => [...messages, botMessage]);

            // Yanıtı akış halinde işle
            for await (const chunk of streamOllamaResponse(conversationHistory)) {
                update((messages) => {
                    const updatedMessages = [...messages];
                    const lastMessage = updatedMessages[updatedMessages.length - 1];

                    if (lastMessage.sender === 'bot') {
                        lastMessage.content += chunk; // Bot mesajına parça ekleyelim
                    }

                    return updatedMessages;
                });
            }
        },

        getConversationHistory() {
            let history: { role: string; content: string }[] = [];
            this.subscribe((messages) => {
                history = messages.map((msg) => ({
                    role: msg.sender,
                    content: msg.content,
                }));
            })();
            return history;
        },

        reset() {
            set([]); // Sohbet geçmişini sıfırla
        },
        stopStreaming(){
        ollamaStreamAbort();
        }
    };
}

export const chatStore = createChatStore();