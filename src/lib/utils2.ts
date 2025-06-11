export function parseSystemMessages(content: string) {
    
    const parts: Array<{ type: 'text' | 'smart-window'; value: string; systemType?: string; allText?:string}> = [];

    let currentIndex = 0;
 
    // console.log("gelen içerik",data);
    // console.log("main data",mainData);
    // let splitData: string[] = mainData.split("🧲");
    // console.log("splite data:",splitData);
    
    while (currentIndex < content.length) {
        const data = content.match(/🛠️(.*?)🛠️/);
        if(data !== null){

        }
        let mainData = data[1];
        let splitData: string[] = mainData.split("🧲");

        parts.push({ type: 'smart-window', systemType: splitData[1], value: splitData[2] ,allText:mainData});
        
    }

    return parts;
}

function splitDataByLevel(data: string, splitLevel: number): string[] {
    // Emoji array'ı tanımlıyoruz
    const emojiArray: string[] = ["🚀", "🌟", "⚡","📡","🪛","🛢️","🧫"];

    // Split level'in geçerli olup olmadığını kontrol ediyoruz
    if (splitLevel < 0 || splitLevel >= emojiArray.length) {
        throw new Error(`Geçersiz splitLevel değeri. Level 0 ile ${emojiArray.length - 1} arasında olmalıdır.`);
    }

    // Seçilen emoji'yi alıyoruz
    const selectedEmoji: string = emojiArray[splitLevel];

    // String'i seçilen emojiye göre bölüyoruz
    const resultArray: string[] = data.split(selectedEmoji);

    return resultArray;
}