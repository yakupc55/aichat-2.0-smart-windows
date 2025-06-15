// src/lib/chatStore.ts
import { lmStudioStreamAbort, streamLMStudioResponse } from '$lib/Services/lmStudioServiceWithAddFeatureApi';
// Eğer ollamaService'i kullanıyorsanız:
// import { ollamaStreamAbort, streamOllamaResponse } from '$lib/Services/ollamaService';
import { writable } from 'svelte/store';

export type Message = {
    id: string;
    sender: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

function createChatStore() {
    const { subscribe, update, set } = writable<Message[]>([]);
    const isStreaming = writable(false); // isStreaming'i bir writable store olarak tanımla

    return {
        subscribe,
        isStreaming, // isStreaming'i dışarıya aç
        addDocumationMessage(documentMessage: string){
        let infoMessage = "🛠️smart-window🧲hide-data🧲title🌟içe aktarılan yapılandırma mesajları🚀"+documentMessage+"🛠️"
        const newMessage: Message = {
            id: crypto.randomUUID(),
            sender: 'assistant',
            content: infoMessage, // dökümantasyon bilgisi
            timestamp: new Date(),
        };
        update((messages) => [...messages, newMessage]);
        },
        // documentation parametresini isteğe bağlı hale getiriyoruz
        async addMessage(userMessage: string) {
            let fullUserContent = userMessage;

            // Eğer documentation varsa, kullanıcı mesajının altına ekle
            // Markdown kod bloğu ile formatlıyoruz

            const newMessage: Message = {
                id: crypto.randomUUID(),
                sender: 'user',
                content: fullUserContent, // Güncellenmiş içerik
                timestamp: new Date(),
            };
           
            update((messages) => [...messages, newMessage]);
            
            // Kullanıcı mesajını ekleyelim
            

            // Bot'un yanıtını alalım
            // Not: LLM'e göndermek istediğiniz history'de documentation olmalı mı karar verin.
            // Şu anki durumda, fullUserContent ile documentation da history'ye dahil olacak.
            // Eğer LLM'in sadece saf kullanıcı sorusunu görmesini isterseniz, burada `userMessage`
            // ile bir "geçmiş" oluşturmanız gerekebilir. Ancak genellikle context olması tercih edilir.
            const conversationHistory = this.getConversationHistory();

            // Bot mesajını oluştur
            const botMessage: Message = {
                id: crypto.randomUUID(),
                sender: 'assistant',
                content: '',
                timestamp: new Date(),
            };

            // Bot mesajını mağazaya ekleyelim (başlangıçta boş içerik)
            update((messages) => [...messages, botMessage]);

            // Akış başladı
            isStreaming.set(true);

            try {
                // Yanıtı akış halinde işle
                // console.log("Sohbet geçmişi apiye gönderiliyor:");
                // console.log(JSON.stringify(conversationHistory, null, 2));

                // Kullandığınız LLM servisine göre birini uncomment edin:
                // for await (const chunk of streamOllamaResponse(conversationHistory)) {
                for await (const chunk of streamLMStudioResponse(conversationHistory)) {
                    update((messages) => {
                        const updatedMessages = [...messages];
                        const lastMessage = updatedMessages[updatedMessages.length - 1];

                        if (lastMessage && lastMessage.sender === 'assistant') { // lastMessage kontrolü eklendi
                            lastMessage.content += chunk; // Bot mesajına parça ekleyelim
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
                // Akış tamamlandı veya durduruldu
                isStreaming.set(false);
            }
        },

        getConversationHistory() {
            let history: { role: string; content: string }[] = [];
            // Bu kısım subscribe fonksiyonunu hemen çağırıp aboneliği bırakır.
            // Anlık değeri almak için kullanılır.
            subscribe((messages) => {
                history = messages.map((msg) => ({
                    role: msg.sender,
                    content: msg.content,
                }));
            })(); // `()` subscribe'ı çağırıp hemen unsubscribe eder.
            return history;
        },

        reset() {
            set([]); // Sohbet geçmişini sıfırla
            isStreaming.set(false); // Akış durumunu sıfırla
        },

        stopStreaming() {
            // Kullanılan LLM servisine göre birini uncomment edin:
            // ollamaStreamAbort(); // Akışı durdur
            lmStudioStreamAbort();
            isStreaming.set(false); // Akış durumu false olsun
        },
    };
}

export const chatStore = createChatStore();