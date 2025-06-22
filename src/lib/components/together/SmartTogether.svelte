<!-- SmartTogether.svelte -->
<script lang="ts">
  import { t } from "$lib/lang";
  // selfPeerId, selfRole, connectedPeers, dataChannels, receivedMessages, currentRoomId güncellemelerle birlikte import edildi
  // selfUserName ve peerUserNames da eklendi
  import { connectSignalingServer, createRoom, joinRoom, selfPeerId, selfRole, currentRoomId, connectedPeers, dataChannels, receivedMessages, sendDataToAllPeers, disconnectP2P, selfUserName, peerUserNames, setUserName } from '$lib/p2p';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import Lobby from './Lobby.svelte';
  import { gameTypes, getGameTypeById, type GameType } from './gameTypes';
	import { get } from "svelte/store";
 
  export let value: string; // Yönetici için AI'dan gelen oyun içeriği
  
  const SIGNALING_SERVER_URL = 'ws://localhost:3005'; // Port numarasını kontrol edin!

  let view: 'lobby' | 'game' = 'lobby';
  let selectedGameType: GameType | undefined = gameTypes[0]; // Varsayılan olarak ilk oyunu seç
  let isGameInitialized: boolean = false; // Oyunun başlatılıp başlatılmadığını takip eden yeni state

  // Kullanıcı adı için lokal state
  let localUserName: string = get(selfUserName); // p2p store'undan başlangıç değerini al

  onMount(() => {
    connectSignalingServer(SIGNALING_SERVER_URL);
    window.addEventListener('p2pMessage', handleGlobalP2PMessage);
    window.addEventListener('p2pPlayerLeft', handlePlayerLeft);
    window.addEventListener('p2pRoomStatus', handleRoomStatusChange);

    // Kendi ismimizi p2p store'una bağla
    selfUserName.subscribe(name => {
        if (localUserName !== name) { // Çift güncellemeden kaçın
            localUserName = name;
        }
    });
  });

  onDestroy(() => {
    disconnectP2P();
    window.removeEventListener('p2pMessage', handleGlobalP2PMessage);
    window.removeEventListener('p2pPlayerLeft', handlePlayerLeft);
    window.removeEventListener('p2pRoomStatus', handleRoomStatusChange);
  });

function handleGlobalP2PMessage(event: Event) {
    const customEvent = event as CustomEvent;
    const message = customEvent.detail.message;
    const senderPeerId = customEvent.detail.senderPeerId;

    if (message.type === 'startGame' && $selfRole !== 'manager') {
      isGameInitialized = true;
    } else if (message.type === 'endGame') { // Yönetici veya kendisi oyunu bitirdiğinde
      isGameInitialized = false; // Oyunun bittiğini işaretle
      // Quiz bittiğinde otomatik olarak lobie dön:
      view = 'lobby'; // YENİ EKLENDİ / DÜZELTİLDİ
      console.log('Oyun sona erdi, lobie dönülüyor.');
    } else if (message.type === 'gameStatus' && $selfRole !== 'manager') {
        // ...
    } else if (message.type === 'resetQuiz' && $selfRole !== 'manager') {
        isGameInitialized = false;
        view = 'lobby'; // Resetlendiğinde de lobie dön
    }
  }

  function handlePlayerLeft(event: Event) {
    const customEvent = event as CustomEvent;
    // P2P modülündeki removePeer fonksiyonundan playerLeft geliyor
    // Eğer tüm P2P bağlantıları koptuysa veya oda kapandıysa lobie dön
    if (!$currentRoomId) { // Odadan çıktıysak
        view = 'lobby';
        isGameInitialized = false;
        selectedGameType = gameTypes[0]; // Varsayılan oyun türüne sıfırla
    }
  }

  function handleRoomStatusChange(event: Event) {
    const customEvent = event as CustomEvent;
    if (customEvent.detail.type === 'roomClosed') {
        view = 'lobby';
        isGameInitialized = false;
        selectedGameType = gameTypes[0];
        console.log("Oda kapandı, lobie dönülüyor.");
    } else if (customEvent.detail.type === 'roomCreated' && $selfRole === 'manager') {
        isGameInitialized = false; // Yönetici olarak oda oluşturulduğunda, oyun henüz başlamaz
    } else if (customEvent.detail.type === 'roomJoined' && $selfRole === 'participant') {
        isGameInitialized = false; // Katılımcı olarak odaya girildiğinde, oyun henüz başlamaz
    }
  }

  function handleCreateRoom(e: CustomEvent) {
    createRoom(e.detail.roomId, e.detail.gameId, e.detail.password); // Şifre ve gameId'yi p2p.ts'e ilet
    isGameInitialized = false; // Yönetici odası oluşturulduğunda oyun başlatılmaz
  }

  function handleJoinRoom(e: CustomEvent) {
    joinRoom(e.detail.roomId, e.detail.password); // Şifreyi p2p.ts'e ilet
    isGameInitialized = false; // Katılımcı olarak odaya katıldığında oyun başlatılmaz
  }

  function handleSendData(event: CustomEvent) {
    sendDataToAllPeers(event.detail.data);
    // Yönetici kendi isGameInitialized state'ini buradan günceller
    if (event.detail.data.type === 'startGame' && $selfRole === 'manager') {
      isGameInitialized = true;
    } else if (event.detail.data.type === 'endGame' && $selfRole === 'manager') {
      isGameInitialized = false;
    } else if (event.detail.data.type === 'resetQuiz' && $selfRole === 'manager') {
        isGameInitialized = false; // Yönetici resetlediyse oyun başlamamış gibi davran
    }
  }

  // Debug için
  function sendTestMessage() {
    sendDataToAllPeers({ type: 'chat', message: `Merhaba, benim ID'im: ${$selfPeerId}, adım: ${$selfUserName}` });
  }

  $: isConnected = $selfPeerId !== null;
  $: inRoom = $currentRoomId !== null;

  $: {
    // Oda içindeysek ve bir rolümüz varsa oyun görünümüne geç
    if (inRoom && ($selfPeerId || $connectedPeers.size > 0) && view === 'lobby') {
      view = 'game';
    } else if (!inRoom && view === 'game') {
        view = 'lobby'; // Odadan çıkılırsa lobie dön
    }
  }

  // Kullanıcı adı değiştiğinde p2p modülüne bildir
  function updateUserName() {
    setUserName(localUserName);
  }
</script>

<style>
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
    <!-- <h1>{t('smartTogetherTitle')}</h1> -->
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
      bind:selectedGameId={selectedGameType.id}
    />
  {:else if view === 'game'}
    {#if selectedGameType}
      <svelte:component 
        this={selectedGameType.component}
        value={value}
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

  <div class="debug-info">
    <strong>Gelen P2P Mesajları:</strong>
    {#each $receivedMessages as msg}
      <div>{msg}</div>
    {/each}
    <button on:click={sendTestMessage}>Test Mesajı Gönder</button>
  </div>
</div>