// src/lib/ollamaService.ts
import ollama from 'ollama';

export async function* streamOllamaResponse(messages: { role: string; content: string }[]) {
    try {
        const responseStream = await ollama.chat({
            model: 'gemma3:1b', // Model adını burada belirtin
            messages: messages,
            stream: true, // Stream özelliği etkinleştirildi
        });

        for await (const part of responseStream) {
            yield part.message.content; // Her parça anlık olarak yield edilir
        }
    } catch (error) {
        console.error('Ollama API error:', error);
        throw new Error('Failed to fetch response from Ollama');
    }
}

export function ollamaStreamAbort() {
    ollama.abort();
}