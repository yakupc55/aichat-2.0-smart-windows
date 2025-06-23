<!-- SmartTogether.svelte -->
<script lang="ts">
  import { t } from "$lib/lang";
  import { connectSignalingServer, createRoom, joinRoom, selfPeerId, selfRole, currentRoomId, connectedPeers, dataChannels, receivedMessages, sendDataToAllPeers, disconnectP2P, selfUserName, peerUserNames, setUserName } from '$lib/p2p';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import Lobby from './Lobby.svelte';
  import { gameTypes, getGameTypeById, type GameType } from './gameTypes';
	import { get } from "svelte/store";
 
  export let value: string; // Yönetici için AI'dan gelen tüm oyun içeriği stringi
  
  const SIGNALING_SERVER_URL = 'ws://localhost:3005'; 

  let view: 'lobby' | 'game' = 'lobby';
  let selectedGameType: GameType | undefined; 
  let isGameInitialized: boolean = false; 

  let localUserName: string = get(selfUserName); 

  // Alt bileşene gönderilecek ayrıştırılmış value
  let subGameValue: string = '';

  // AI'dan gelen value'dan ayrıştırılan ana oyun ID'si (Quiz vb.)
  let parsedMainGameIdFromValue: string | undefined; 
  // AI'dan gelen value'dan ayrıştırılan alt oyun içeriği stringi
  let parsedSubGameValueFromValue: string = '';

  onMount(() => {
    connectSignalingServer(SIGNALING_SERVER_URL);
    window.addEventListener('p2pMessage', handleGlobalP2PMessage);
    window.addEventListener('p2pPlayerLeft', handlePlayerLeft);
    window.addEventListener('p2pRoomStatus', handleRoomStatusChange);

    selfUserName.subscribe(name => {
        if (localUserName !== name) { 
            localUserName = name;
        }
    });

    // value prop'u yüklendiğinde, sadece ayrıştırma işlemini yap
    // selectedGameType ve subGameValue ataması 'view' reaktif ifadesiyle yapılacak
    parseIncomingValue(value);
  });

  onDestroy(() => {
    disconnectP2P();
    window.removeEventListener('p2pMessage', handleGlobalP2PMessage);
    window.removeEventListener('p2pPlayerLeft', handlePlayerLeft);
    window.removeEventListener('p2pRoomStatus', handleRoomStatusChange);
  });

  // value prop'u değiştiğinde AI'dan gelen değeri ayrıştır
  $: {
    if (value) {
      parseIncomingValue(value);
    }
  }

  // selectedGameType ve subGameValue'yu view state'ine göre ayarla
  $: {
    if (view === 'lobby') {
      selectedGameType = gameTypes[0]; // Lobbydeyken her zaman varsayılan (Lobi) oyun tipi
      subGameValue = ''; // Lobbydeyken alt oyuna değer göndermiyoruz
    } else if (view === 'game') {
      // Game görünümündeyken, ayrıştırılmış değerleri kullan
      const game = parsedMainGameIdFromValue ? getGameTypeById(parsedMainGameIdFromValue) : undefined;
      if (game) {
        selectedGameType = game;
      } else {
        selectedGameType = gameTypes[0]; // Eğer geçerli oyun bulunamazsa yine de varsayılanı kullan
        // console.warn(`"${parsedMainGameIdFromValue || value}" ID'sine sahip ana oyun bulunamadı. Varsayılan oyun seçildi: ${gameTypes[0].name}.`);
      }
      subGameValue = parsedSubGameValueFromValue;
    }
  }

  // Sadece AI'dan gelen değeri ayrıştıran fonksiyon
  function parseIncomingValue(fullValueString: string) {
    const firstRocketIndex = fullValueString.indexOf('🚀');

    if (firstRocketIndex !== -1) {
        const mainGamePart = fullValueString.substring(0, firstRocketIndex);
        const mainGameMatch = mainGamePart.match(/game🌟([^🌟]+)/);
        if (mainGameMatch && mainGameMatch[1]) {
            parsedMainGameIdFromValue = mainGameMatch[1];
        } else {
            // "game🌟" kalıbı bulunamazsa, tüm ilk kısmı dene
            parsedMainGameIdFromValue = mainGamePart; 
        }
        parsedSubGameValueFromValue = fullValueString.substring(firstRocketIndex + 2);
    } else {
        // Eğer '🚀' yoksa, tüm stringi hem ana oyun ID'si hem de alt oyun value'su olarak kabul et
        parsedMainGameIdFromValue = fullValueString;
        parsedSubGameValueFromValue = fullValueString;
        // console.warn("AI'dan gelen 'value' içinde '🚀' ayracı bulunamadı. Tüm string ana oyun ID'si ve alt oyun value'su olarak kabul edildi.");
    }
  }

  function handleGlobalP2PMessage(event: Event) {
    const customEvent = event as CustomEvent;
    const message = customEvent.detail.message;
    const senderPeerId = customEvent.detail.senderPeerId;

    if (message.type === 'startGame' && ($selfRole === 'manager' || $selfRole === 'managerPlayer')) {
      isGameInitialized = true;
    } else if (message.type === 'endGame') { 
      isGameInitialized = false; 
      view = 'lobby'; // Oyun bitince lobie dön
      // console.log('Oyun sona erdi, lobie dönülüyor.');
    } else if (message.type === 'gameStatus' && ($selfRole === 'manager' || $selfRole === 'managerPlayer')) {
        // ...
    } else if (message.type === 'resetQuiz' && ($selfRole === 'manager' || $selfRole === 'managerPlayer')) {
        isGameInitialized = false;
        view = 'lobby'; // Resetlenince lobie dön
    }
  }

  function handlePlayerLeft(event: Event) {
    const customEvent = event as CustomEvent;
    if (!$currentRoomId) { 
        view = 'lobby';
        isGameInitialized = false;
        // AI'dan gelen değeri tekrar ayrıştırmaya gerek yok, 'view' reaktif ifadesi halleder.
    }
  }

  function handleRoomStatusChange(event: Event) {
    const customEvent = event as CustomEvent;
    if (customEvent.detail.type === 'roomClosed') {
        view = 'lobby';
        isGameInitialized = false;
        // AI'dan gelen değeri tekrar ayrıştırmaya gerek yok, 'view' reaktif ifadesi halleder.
        // console.log("Oda kapandı, lobie dönülüyor.");
    } else if (customEvent.detail.type === 'roomCreated' && $selfRole === 'manager') {
        isGameInitialized = false; 
        // Oda oluşturulduğunda view zaten 'game'e dönecek, bu da selectedGameType'ı AI'dan gelen değere göre ayarlar.
    } else if (customEvent.detail.type === 'roomJoined' && $selfRole === 'participant') {
        isGameInitialized = false; 
        // Odaya katılındığında view zaten 'game'e dönecek, bu da selectedGameType'ı AI'dan gelen değere göre ayarlar.
    }
  }

  function handleCreateRoom(e: CustomEvent) {
    // Oda oluşturulurken, Lobide seçili olan oyun ID'sini (yani Lobi oyun tipini) gönderiyoruz.
    // Gerçek oyun tipi, yönetici oyunu başlattığında p2p üzerinden duyurulacak.
    createRoom(e.detail.roomId, e.detail.gameId, e.detail.password); 
    isGameInitialized = false; 
  }

  function handleJoinRoom(e: CustomEvent) {
    joinRoom(e.detail.roomId, e.detail.password); 
    isGameInitialized = false; 
  }

  function handleSendData(event: CustomEvent) {
    sendDataToAllPeers(event.detail.data);
    if (event.detail.data.type === 'startGame' && ($selfRole === 'manager' || $selfRole === 'managerPlayer')) {
      
      isGameInitialized = true;
    } else if (event.detail.data.type === 'endGame' && ($selfRole === 'manager' || $selfRole === 'managerPlayer')) {
      isGameInitialized = false;
    } else if (event.detail.data.type === 'resetQuiz' && ($selfRole === 'manager' || $selfRole === 'managerPlayer')) {
        isGameInitialized = false; 
    }
  }

  function sendTestMessage() {
    sendDataToAllPeers({ type: 'chat', message: `Merhaba, benim ID'im: ${$selfPeerId}, adım: ${$selfUserName}` });
  }

  $: isConnected = $selfPeerId !== null;
  $: inRoom = $currentRoomId !== null;

  // Bu reaktif ifade, odadaki durumu kontrol ederek view state'ini günceller.
  $: {
    if (inRoom && ($selfPeerId || $connectedPeers.size > 0) && view === 'lobby') {
      view = 'game'; // Odaya girildiğinde veya oda oluşturulduğunda oyun görünümüne geç
    } else if (!inRoom && view === 'game') {
        view = 'lobby'; // Odadan çıkılırsa lobie dön
    }
  }

  function updateUserName() {
    setUserName(localUserName);
  }
</script>

<style>
  /* Stiller değişmedi */
  .container {
    /* max-width: 900px; */
    margin: 0.25rem auto;
    padding: 0.25rem;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    background-color: white;
  }
  .header {
    text-align: center;
    margin-bottom: 0.5rem;
  }
  .header h1 {
    color: #1a237e;
    font-size: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .header p {
    color: #424242;
    font-size: 1.2rem;
  }
  .status-info {
    margin-bottom: 0.5rem;
    padding: 0.4rem;
    background-color: #e3f2fd;
    border-radius: 8px;
    color: #1976d2;
    font-weight: 500;
    text-align: center;
  }
  .status-info span {
    font-weight: bold;
    color: #0d47a1;
  }
  .debug-info {
    margin-top: 0.5rem;
    padding: 0.25rem;
    background-color: #f5f5f5;
    border-radius: 8px;
    font-family: monospace;
    font-size: 0.85rem;
    color: #555;
  }
  .username-input-group {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 0.5rem;
    padding: 0.2rem;
    background-color: #f0f4f8;
    border-radius: 8px;
    border: 1px solid #cce7ff;
  }
  .username-input-group label {
    font-weight: 600;
    color: #2c3e50;
  }
  .username-input-group input {
    flex-grow: 1;
    padding: 0.6rem;
    border: 1px solid #a8d5ff;
    border-radius: 5px;
    font-size: 1rem;
  }
  .username-input-group button {
    padding: 0.5rem 0.5rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
  }
  .username-input-group button:hover {
    background-color: #43A047;
  }
</style>

<div class="container">
  <header class="header">
    <p>{t('smartTogetherSubtitle')}</p>
  </header>

  <div class="username-input-group">
    <label for="user-name">{t('yourName')}:</label>
    <input
      type="text"
      id="user-name"
      bind:value={localUserName}
      placeholder={t('enterYourName')}
      on:blur={updateUserName}
      on:keydown={(e) => { if (e.key === 'Enter') updateUserName(); }}
      maxlength="20"
    />
    <button on:click={updateUserName}>{t('save')}</button>
  </div>

  <div class="status-info">
    {#if $selfPeerId}
      {t('yourPeerId')}: <span>{$selfPeerId}</span>
    {:else}
      {t('connectingToServer')}...
    {/if}
    {#if $selfUserName}
        <br> {t('yourUserName')}: <span>{$selfUserName}</span>
    {/if}
    {#if $currentRoomId}
      <br> {t('currentRoom')}: <span>{$currentRoomId}</span>
    {/if}
    <br> {t('connectedPeers')}: <span>{$connectedPeers.size}</span>
    <br> {t('yourRole')}: <span>{t($selfRole)}</span>
  </div>

  {#if view === 'lobby'}
    <Lobby
      on:createRoom={handleCreateRoom}
      on:joinRoom={handleJoinRoom}
      isConnected={$selfPeerId !== null}
      selectedGameId={selectedGameType ? selectedGameType.id : gameTypes[0].id}
    />
  {:else if view === 'game'}
    {#if selectedGameType}
      <svelte:component 
        this={selectedGameType.component}
        value={subGameValue} 
        currentRoomId={$currentRoomId}
        selfPeerId={$selfPeerId}
        selfRole={$selfRole}
        connectedPeers={$connectedPeers}
        dataChannels={$dataChannels}
        on:sendData={handleSendData}
        isGameInitialized={isGameInitialized}
        playerUserNames={$peerUserNames}
      />
    {:else}
      <p>{t('noGameSelected')}</p>
    {/if}
  {/if}

  <!-- <div class="debug-info">
    <strong>Gelen P2P Mesajları:</strong>
    {#each $receivedMessages as msg}
      <div>{msg}</div>
    {/each}
    <button on:click={sendTestMessage}>Test Mesajı Gönder</button>
  </div> -->
</div>