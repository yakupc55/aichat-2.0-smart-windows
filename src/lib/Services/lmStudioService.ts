// src/lib/lmStudioService.ts
    let controller: AbortController | null = null;
export async function* streamLMStudioResponse(messages: { role: string; content: string }[]) {

    controller =  new AbortController();
    try {
        const response = await fetch('http://localhost:1234/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Eğer LM Studio'da API key gerekiyorsa buraya ekleyin
                // 'Authorization': `Bearer ${YOUR_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gemma3-1b-smart-windows', // LM Studio'da yüklü modelin adı
                messages: messages,
                stream: true,
            }),
            signal: controller.signal,
        });

        if (!response.body) {
            throw new Error('No response body from LM Studio');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const json = line.slice(6).trim();
                    if (json === '[DONE]') return;

                    try {
                        const parsed = JSON.parse(json);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            yield content;
                        }
                    } catch (e) {
                        console.warn('Failed to parse stream chunk:', e);
                    }
                }
            }
        }
    } catch (error) {
    if (error?.name === 'AbortError') {
        console.log('Stream aborted by user.');
        // Hata fırlatma! Çünkü bu normal bir durum.
        return;
    }

    console.error('LM Studio API error:', error);
    throw new Error('Failed to fetch response from LM Studio');
}
}

// Abort helper


export function lmStudioStreamAbort() {
    if (controller) {
        controller.abort();
        controller = null;
    }
}
