<script lang="ts">
  export let value: string;
  console.log("value");
  console.log(value);
    import { t} from '$lib/lang';
  let title = '';
  let formula = '';
  let resultKey = 'sonuç';
  let unit = '';
  let result: number | null = null;

  type InputField = {
    name: string;
    key: string;
    type: string;
    value: number | string;
    unit?: string;
  };

  let inputs: InputField[] = [];

  $: {
    try {
      // Regex'i daha basit ve etkili hale getirdim
      const titleMatch = value.match(/title=['"]([^'"]+)['"]/);
      const formulaMatch = value.match(/formula=['"]([^'"]+)['"]/);
      const resultKeyMatch = value.match(/resultKey=['"]([^'"]+)['"]/);
      const unitMatch = value.match(/unit=['"]([^'"]+)['"]/);
      const inputsMatch = value.match(/inputs=\[([^\]]*)\]/);

      title = titleMatch?.[1] ?? '';
      formula = formulaMatch?.[1] ?? '';
      resultKey = resultKeyMatch?.[1] ?? 'sonuç';
      unit = unitMatch?.[1] ?? '';

      if (inputsMatch?.[1]) {
        const fixedJson = inputsMatch[1]
          .replace(/(\w+):/g, '"$1":')
          .replace(/'/g, '"');
        inputs = JSON.parse(`[${fixedJson}]`);
      }
    } catch (err) {
      console.error("Parsing error:", err);
    }
  }

  function calculate() {
    try {
      let localVars: Record<string, number> = {};
      inputs.forEach(input => {
        localVars[input.key] = Number(input.value);
      });

      const func = new Function(...Object.keys(localVars), `return ${formula};`);
      result = func(...Object.values(localVars));
    } catch (err) {
      console.error("Calculation error:", err);
      result = null;
    }
  }
</script>

<style>
  .label {
    font-weight: bold;
    display: block;
    margin-top: 1rem;
  }
  .input-group {
    margin-bottom: 1rem;
  }
  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 80%;
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
  .result {
    margin-top: 1rem;
    padding: 0.8rem;
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 4px;
    color: #166534;
    font-size: 1.1rem;
  }
  .unit {
    color: #64748b;
    font-size: 0.9rem;
    margin-left: 0.3rem;
  }
  .result-key {
    font-weight: bold;
  }
</style>

<div>
  <h3 class="label">🧮 {title}</h3>
  <p><strong>{t('FormulText')}:</strong> {formula}</p>

  {#each inputs as input, i}
    <div class="input-group">
      <label class="label" for={input.key}>
        {input.name}
        {#if input.unit}
          <span class="unit">({input.unit})</span>
        {/if}
      </label>
      <input
        id={input.key}
        type={input.type}
        bind:value={inputs[i].value}
      />
    </div>
  {/each}

  <button class="btn" on:click={calculate}>{t('CalculateText')}</button>

  {#if result !== null}
    <div class="result">
      <span class="result-key">✅ {resultKey}:</span> {result}
      {#if unit}
        <span class="unit">{unit}</span>
      {/if}
    </div>
  {/if}
</div>