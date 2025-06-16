<script lang="ts">
  import { getLanguage, t } from "$lib/lang";
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let clients: Array<{ id: string; metadata: any }>;
  export let selectedClientId: string | null;
   // console.log("clients", clients);
    
  function handleClientSelection(event: Event) {
    const target = event.target as HTMLSelectElement;
    //console.log("target",target);
    
    //console.log('ClientSelectionPanel: Selected Client ID changed to', target.value);
    dispatch('selectClient', { clientId: target.value });
  }

  function requestDocumentation() {
    //console.log('ClientSelectionPanel: Request Documentation button clicked.');
    if (!selectedClientId) {
      console.warn('ClientSelectionPanel: Documentation button clicked but no client is selected.');
    }
    dispatch('requestDocumentation');
  }

  // Debugging props changes
  $: {
    // console.log('ClientSelectionPanel: clients updated', clients.length);
    // console.log('ClientSelectionPanel: selectedClientId updated', selectedClientId);
  }
</script>

<style>
  section {
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #eee;
    border-radius: 8px;
    background-color: #fdfdfd;
  }
  h3 {
    color: #34495e;
    margin-top: 0;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
  }
  select {
    width: calc(100% - 20px);
    padding: 10px;
    margin-bottom: 0.5rem;
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
  .client-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 1rem;
  }
  .client-item {
    background-color: #e9ecef;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 0.9em;
    color: #495057;
    border: 1px solid #dee2e6;
  }
  .client-item.active {
    background-color: #28a745;
    color: white;
    border-color: #28a745;
  }
</style>

<section>
  <h3>{t('availableClientsText')}</h3>
  <div class="client-list">
    {#each clients as client (client.id)}
      <span class="client-item" class:active={selectedClientId === client.id}>
        {client.metadata.name || client.id}
        {#if client.metadata.description[getLanguage()]}
          ({client.metadata.description[getLanguage()]})
        {/if}
      </span>
    {/each}
    {#if clients.length === 0}
      <p>{t('noClientsAvailableText')}</p>
    {/if}
  </div>

  <label for="select-client">{t('selectClientText')}:</label>
        
<!-- ClientSelectionPanel.svelte -->
<select id="select-client" on:change={handleClientSelection}>
  <option value="">{t('chooseClientText')}</option>
  {#each clients as client (client.id)}
  {client}
    <!-- value={client.id} yerine direkt value="{client.id}" deneyelim -->
    <option value="{client.id}" selected={selectedClientId === client.id}>
      {client.metadata.name || client.id}
    </option>
  {/each}
</select>
  
  <button on:click={requestDocumentation} disabled={!selectedClientId}>
    {t('requestDocumentationText')}
  </button>
</section>