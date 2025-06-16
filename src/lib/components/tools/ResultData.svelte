      
<!-- hideData.svelte -->
<script lang="ts">
  import { createMapFromSplitData, splitDataByLevel } from "$lib/utils";

  export let value: string; // value prop'u dışarıdan gelecek

  let title: string = 'Sonuç Ekranı'; // Varsayılan başlık
  let debugParsedValue: Map<string, string>; // Debug için parsed değeri tutalım
  let data: string = '';
  // value prop'u değiştiğinde reaktif olarak çalışır
  $: {
    try {
      const splitData = splitDataByLevel(value, 0);
      const valuesDatas = createMapFromSplitData(splitData, 1);
      title = valuesDatas.get('title') || 'Sonuç Ekranı';
      data = valuesDatas.get('data')||null;
      
    } catch (err) {
      console.error("hideData.svelte: Error parsing value:", err);
      title = 'Sonuç Ekranı (Hata)';
      debugParsedValue = new Map(); // Hata durumunda boş map ata
    }
  }
</script>

<div>
{title}
<section>{data}</section>
</div>

<style>
  /* Bileşenin görünürlüğünü kontrol eden stil */
  .hidden-data-container {
    display: none;
  }
    section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    border: 1px solid #eee;
    border-radius: 8px;
    background-color: #fdfdfd;
  }
</style>

    