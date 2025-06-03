export function parseSystemMessages(content: string) {
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