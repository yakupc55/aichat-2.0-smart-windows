export function parseSystemMessages(content: string) {
    const parts: Array<{ type: 'text' | 'smart-window'; value: string; systemType?: string ;allText:string}> = [];
    let currentIndex = 0;
    // console.log("current index",currentIndex);
    // console.log("content",content);
    while (currentIndex < content.length) {

        currentIndex++;
         //console.log("akış devam ediyor");
         //parts.push({ type: 'text', value: "quiz" ,allText:content});
    }
    // console.log("current index",currentIndex);
    // console.log("content",content);
    // console.log("akış durdu.");
    const datas = content.split(/🛠️(.*?)🛠️/); // Regex'e göre böler
    // console.log("datas",datas);
    
    if(datas.length>1){
        const smartWindowData = datas[1].split("🧲");
        // console.log("smartda data", smartWindowData);
        
        const systemType = smartWindowData[1];
        // console.log("syteme type0",systemType);
        
        const typeValue = smartWindowData[2];
        parts.push({ type: 'text', value: datas[0] ,allText:content});
        parts.push({ type: 'smart-window', systemType:systemType, value: typeValue ,allText:content});
        parts.push({ type: 'text', value: datas[2] ,allText:content});
    }else{
        parts.push({ type: 'text', value: datas[0] ,allText:content});
    }
    
    return parts;
}
const emojiArray: string[] = ["🚀", "🌟", "⚡","🛢️","🧫"];
export function splitDataByLevel(data: string, splitLevel: number): string[] {
    // Emoji array'ı tanımlıyoruz
    const emojiArray: string[] = ["🚀", "🌟", "⚡","🛢️","🧫"];

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

export function createMapFromSplitData(splitData : string [], splitLevel = 1) {
  const valuesDatas = new Map();
  
  splitData.forEach(data => {
    const split = splitDataByLevel(data,splitLevel);
      if(split.length<3 && !data.includes(emojiArray[splitLevel+1])){
      const [key, value] = split;
      //console.log("split",split);
      
      valuesDatas.set(key.trim(),value.trim());
      }else{
        const value = split;
        const key = value.shift();
        valuesDatas.set(key,value);
      }
      
  });
  
  return valuesDatas;
}