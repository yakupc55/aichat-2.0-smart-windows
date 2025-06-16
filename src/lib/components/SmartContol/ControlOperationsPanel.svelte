<!-- SmartControl/ControlOperationsPanel.svelte -->
<script lang="ts">
  import { t } from "$lib/lang";
  import { createEventDispatcher } from 'svelte';

  export let selectedClientId: string | null;
  export let documentation: string | null;
  export let commandCode: string;
  export let operationFeedback: string | null;
  export let operationResultData: any; // content ve files gibi ek veriler
  export let targetApp: string | null; // Yeni: targetApp prop'u

  // Dışarıya olay göndermek için
  const dispatch = createEventDispatcher();

  function sendCode() {
    dispatch('sendCommand', { code: commandCode });
  }
</script>

<style>
  section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    border: 1px solid #eee;
    border-radius: 8px;
    background-color: #fdfdfd;
  }
  h3 {
    color: #34495e;
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
  .target-app-info {
    margin-bottom: 1rem;
    padding: 0.8rem;
    background-color: #e6f7ff; /* Açık mavi arka plan */
    border: 1px solid #91d5ff; /* Mavi kenarlık */
    border-radius: 5px;
    color: #0056b3; /* Koyu mavi metin */
    font-weight: bold;
    font-size: 0.95em;
  }
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
  }
  textarea {
    width: calc(100% - 20px);
    padding: 10px;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1em;
    box-sizing: border-box;
  }
  button {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.2s ease;
  }
  button:hover {
    background-color: #0056b3;
  }
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  pre {
    background-color: #f4f4f4;
    border: 1px solid #ddd;
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 300px;
    white-space: pre-line;
  }
  .feedback-message {
    margin-top: 1rem;
    padding: 10px;
    border-radius: 5px;
    font-weight: bold;
  }
  .success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  .error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  .info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  }
</style>

{#if documentation}
  <section>
    <h3>{t('documentationForClientText', { 0: selectedClientId || 'Seçili Client' })}</h3>
    <pre>{documentation}</pre>
  </section>
{/if}

<section>
  <!-- <h3>{t('controlPanelText')}</h3> -->

  {#if targetApp}
    <div class="target-app-info">
      {t('sendingCommandToAppText')}: <strong>{targetApp}</strong>
    </div>
  {/if}

  <label for="command-code">{t('commandCodeText')}:</label>
  <textarea id="command-code" bind:value={commandCode} rows="8" placeholder={t('enterJsonCommandText')}></textarea>

  <button on:click={sendCode} disabled={!commandCode}>
    {t('applyOperationText')}
  </button>

  {#if operationFeedback}
    <div
      class="feedback-message"
      class:success={operationFeedback?.includes('success')}
      class:error={operationFeedback?.includes('fail') || operationFeedback?.includes('hata')}
      class:info={!operationFeedback?.includes('success') &&
        !operationFeedback?.includes('fail') &&
        !operationFeedback?.includes('hata')}
    >
      {operationFeedback}
      {#if operationResultData?.content}
        <pre>{operationResultData.content}</pre>
      {/if}

    </div>
  {/if}
</section>