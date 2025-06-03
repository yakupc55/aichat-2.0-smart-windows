<script lang="ts">
  export let value: string;
console.log("value");
console.log(value);

    import { t, currentLang } from '$lib/lang';
  let name = '';
  let description = '';
  let columns: Array<{ name: string; type: string; primary?: boolean }> = [];
  let created = false;

  function parseValueBlock(raw: string) {
    try {
      // name="..."
      const nameMatch = raw.match(/name\\?=["']([^"']+)["']/);
      name = nameMatch?.[1] ?? '';

      // description="..."
      const descMatch = raw.match(/description\\?=["']([^"']+)["']/);
      description = descMatch?.[1] ?? '';

      // columns=[{...}]
      const firstMatch = raw.match(/columns=\\?=["']([^"']+)["']/);
    //   console.log("first match");
    //   console.log(firstMatch);
      
      
      const colsMatch = raw.match(/columns=\{(.*?)\}(;|$)/s);
    //     console.log("colsMatch");
    //   console.log(colsMatch);
      if (colsMatch && colsMatch[1]) {
        // Dönüştür: { 'name': 'id', 'type': 'number' } → JSON.parse edilebilir hale getir
        let colsRaw = colsMatch[1]
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // key'leri çift tırnak içine al
          .replace(/'/g, '"'); // tüm tek tırnakları çift tırnağa çevir

        const colsJson = JSON.parse(`[${colsRaw}]`);
        columns = colsJson;
        // console.log("columns");
        // console.log(columns);
        
        
      }
    } catch (err) {
      console.error('Parsing error:', err);
    }
  }

  $: parseValueBlock(value);

  function createDb() {
    // Simüle edilmiş işlem
    setTimeout(() => {
      created = true;
    }, 1000);
  }
</script>

<style>
  .window {
    font-family: sans-serif;
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 8px;
    background: #f9f9ff;
  }

  .label {
    font-weight: bold;
    margin-bottom: 0.3rem;
    font-size: 0.95rem;
  }

  .value {
    margin-bottom: 1rem;
    background: #fff;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
  }

  .columns {
    border-collapse: collapse;
    width: 100%;
    margin-top: 0.5rem;
  }

  .columns th, .columns td {
    border: 1px solid #ccc;
    padding: 0.4rem 0.6rem;
    text-align: left;
    font-size: 0.9rem;
  }

  .btn {
    background-color: #4f46e5;
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 1rem;
  }

  .btn:hover {
    background-color: #4338ca;
  }

  .success {
    margin-top: 1rem;
    color: green;
    font-weight: bold;
  }
</style>

<div class="window">
  <div class="label">📁 {t('dbName')}</div>
  <div class="value">{name}</div>
  

  <div class="label">📝{t('description')}</div>
  <div class="value">{description}</div>

  <div class="label">📊 {t('columns')}</div>
  <table class="columns">
    <thead>
      <tr>
      <th>{t('fieldName')}</th>
        <th>{t('type')}</th>
        <th>{t('primaryKey')}</th>
      </tr>
    </thead>
    <tbody>
      {#each columns as col}
        <tr>
          <td>{col.name}</td>
          <td>{col.type}</td>
          <td>{col.primary ? '✅' : ''}</td>
        </tr>
      {/each}
    </tbody>
  </table>

{#if !created}
  <button class="btn" on:click={createDb}>
    {t('createDbButton')}
  </button>
{:else}
  <div class="success">
    {t('dbCreatedSuccess')}
  </div>
{/if}
</div>
