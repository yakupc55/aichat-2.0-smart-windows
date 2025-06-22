<!-- Lobby.svelte -->
<script lang="ts">
  import { t } from "$lib/lang";
  import { createEventDispatcher } from 'svelte';
  import { gameTypes } from './gameTypes'; // Oyun türlerini import et

export let isConnected: boolean;
  export let selectedGameId: string; // `SmartTogether`'dan bind ile gelecek

  const dispatch = createEventDispatcher();
  let newRoomId: string = '';
  let createPassword: string = ''; // Yeni: Oda oluşturma şifresi
  let joinRoomId: string = '';
  let joinPassword: string = ''; // Yeni: Odaya katılma şifresi

  function handleCreate() {
    if (newRoomId.length > 0 && newRoomId.length !== 6) {
        alert(t('roomIdMustBe6Digits'));
        return;
    }
    dispatch('createRoom', { roomId: newRoomId || undefined, gameId: selectedGameId, password: createPassword }); // Şifreyi gönder
  }

  function handleJoin() {
    if (joinRoomId.length !== 6) {
      alert(t('roomIdMustBe6Digits'));
      return;
    }
    if (joinRoomId) {
      dispatch('joinRoom', { roomId: joinRoomId, password: joinPassword }); // Şifreyi gönder
    }
  }
</script>

<style>
  .lobby-section {
    padding: 0.25rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: 0.25rem;
    background-color: #fafafa;
  }
  .lobby-section h3 {
    margin-top: 0;
    color: #3f51b5;
    font-size: 1.3rem;
    margin-bottom: 0.25rem;
  }
  .input-group {
    display: flex;
    gap: 0.2rem;
    margin-bottom: 0.5rem;
  }
  .input-group input {
    flex-grow: 1;
    padding: 0.4rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1rem;
  }
  .button {
    padding: 0.5rem 0.5rem;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.2s ease;
  }
  .create-button {
    background-color: #4caf50;
    color: white;
  }
  .create-button:hover {
    background-color: #43a047;
  }
  .join-button {
    background-color: #2196f3;
    color: white;
  }
  .join-button:hover {
    background-color: #1976d2;
  }
  .disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .select-game-type {
    margin-bottom: 1rem;
  }
  .select-game-type label {
    display: block;
    margin-bottom: 0.4rem;
    font-weight: 500;
    color: #555;
  }
  .select-game-type select {
    width: 100%;
    padding: 0.7rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1rem;
    background-color: white;
  }
</style>

<div class="lobby">
  <div class="lobby-section">
    <h3>{t('createRoom')}</h3>
    
    <!-- <div class="select-game-type">
      <label for="game-type">{t('selectGameType')}:</label>
      <select id="game-type" bind:value={selectedGameId}>
        {#each gameTypes as game}
          <option value={game.id}>{game.name}</option>
        {/each}
      </select>
    </div> -->

    <div class="input-group">
      <input type="text" bind:value={newRoomId} placeholder={t('optionalRoomId')} maxlength="6" />
      <button class="button create-button" on:click={handleCreate} disabled={!isConnected || (newRoomId.length > 0 && newRoomId.length !== 6)}>
        {t('create')}
      </button>
    </div>
    <div class="input-group">
      <input type="password" bind:value={createPassword} placeholder={t('optionalPassword')} />
    </div>
    {#if !isConnected}
      <p style="color: #e91e63;">{t('connectToServerToCreate')}</p>
    {/if}
  </div>

  <div class="lobby-section">
    <h3>{t('joinRoom')}</h3>
    <div class="input-group">
      <input type="text" bind:value={joinRoomId} placeholder={t('enterRoomId')} maxlength="6" />
      <button class="button join-button" on:click={handleJoin} disabled={!isConnected || joinRoomId.length !== 6}>
        {t('join')}
      </button>
    </div>
    <div class="input-group">
      <input type="password" bind:value={joinPassword} placeholder={t('enterPasswordIfRequired')} />
    </div>
    {#if !isConnected}
      <p style="color: #e91e63;">{t('connectToServerToJoin')}</p>
    {/if}
  </div>
</div>