      
<!-- hideData.svelte -->
<script lang="ts">
  import { createMapFromSplitData, splitDataByLevel } from "$lib/utils";

  export let value: string; // value prop'u dışarıdan gelecek

  let title: string = 'Saklı Veri Paneli'; // Varsayılan başlık
  let debugParsedValue: Map<string, string>; // Debug için parsed değeri tutalım

  // value prop'u değiştiğinde reaktif olarak çalışır
  $: {
    try {
      const splitData = splitDataByLevel(value, 0)[0];
      
      // title değerini value'dan alıyoruz
      title = splitDataByLevel(splitData, 1)[1] || 'Saklı Veri Paneli (Başlık Eksik)';
      
      
    } catch (err) {
      console.error("hideData.svelte: Error parsing value:", err);
      title = 'Saklı Veri Paneli (Hata)';
      debugParsedValue = new Map(); // Hata durumunda boş map ata
    }
  }
</script>

<div>
{title}
</div>

<style>
  /* Bileşenin görünürlüğünü kontrol eden stil */
  .hidden-data-container {
    display: none;
  }
</style>

    