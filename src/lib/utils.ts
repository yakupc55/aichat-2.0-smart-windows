export function parseSystemMessages(content: string) {
    const parts: Array<{ type: 'text' | 'smart-window'; value: string; systemType?: string ;allText:string}> = [];
    let currentIndex = 0;

    while (currentIndex < content.length) {
        // Bir sonraki [[smart-window]] bloğunun başlangıcını bul
        const startIndex = content.indexOf('[[smart-window]', currentIndex);
        if (startIndex === -1) {
            // Artık [[smart-window]] bloğu kalmadı, kalan tüm metni işle
            parts.push({ type: 'text', value: content.slice(currentIndex) ,allText:content});
            break;
        }

        // Önceki metni işle
        if (startIndex > currentIndex) {
            parts.push({ type: 'text', value: content.slice(currentIndex, startIndex) ,allText:content});
        }

        // [[smart-window]] bloğunun bitişini bul
        const endIndex = findClosingBracket(content, startIndex);
        if (endIndex === -1) {
           // throw new Error("Geçersiz [[smart-window]] yapısı: Kapanış bulunamadı.");
        }

        // Bloğu işle
        const block = content.slice(startIndex, endIndex + 2); // +2: ']]' kısmını da dahil et
        const parsedBlock = parseSmartWindowBlock(block);
        parts.push(parsedBlock);

        // currentIndex'i güncelle
        currentIndex = endIndex + 2;
    }

    return parts;
}

function findClosingBracket(content: string, startIndex: number): number {
    let openBrackets = 0;
    for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '[') openBrackets++;
        if (content[i] === ']') openBrackets--;
        if (openBrackets === 0) return i;
    }
    //return -1; // Kapanış bulunamadı
}

function parseSmartWindowBlock(block: string) {
    // Block: "[[smart-window][quiz][...]]"
    const regex = /\[\[smart-window\]\[([^\]]+)\]\[([\s\S]*)\]\]/;
    const match = block.match(regex);
    if (!match) {
        //throw new Error("Geçersiz [[smart-window]] formatı.");
        return block;
    }
    else{
        return {
        type: 'smart-window',
        systemType: match[1],
        value: match[2],
        allText:block
    };
    }

}