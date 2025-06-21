<!-- SmartTogether.svelte -->
<script lang="ts">
  import { t } from "$lib/lang";
  import { connectSignalingServer, createRoom, joinRoom, selfPeerId, selfRole, currentRoomId, connectedPeers, dataChannels, receivedMessages, sendDataToAllPeers, disconnectP2P } from '$lib/p2p';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import Lobby from './Lobby.svelte';
  import { gameTypes, getGameTypeById, type GameType } from './gameTypes'; // Yeni eklenen
  
 export let value: string; // Yönetici için AI'dan gelen oyun içeriği
  
  const SIGNALING_SERVER_URL = 'ws://localhost:3005'; // Port numarasını kontrol edin!

  let view: 'lobby' | 'game' = 'lobby';
  let selectedGameType: GameType | undefined = gameTypes[0]; // Varsayılan olarak ilk oyunu seç
  let isGameInitialized: boolean = false; // Oyunun başlatılıp başlatılmadığını takip eden yeni state

  onMount(() => {
    connectSignalingServer(SIGNALING_SERVER_URL);
    window.addEventListener('p2pMessage', handleGlobalP2PMessage);
    window.addEventListener('p2pPlayerLeft', handlePlayerLeft);
    window.addEventListener('p2pRoomStatus', handleRoomStatusChange);
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
      // Katılımcı/İzleyici: Yönetici oyunu başlattığında
      isGameInitialized = true; // Oyun başlatıldı olarak işaretle
      // Oyun içeriği (value) ve türü gameStatus mesajıyla gelecek
    } else if (message.type === 'endGame') { // Yönetici veya kendisi oyunu bitirdiğinde
      isGameInitialized = false; // Oyunun bittiğini işaretle
    } else if (message.type === 'gameStatus' && $selfRole !== 'manager') {
        // Katılımcı: Yöneticiden gelen gameStatus'ten oyun türünü al
        const gameId = (message.questions && message.questions.length > 0) ? gameTypes[0].id : 'quiz'; // varsayılan olarak quiz
        selectedGameType = getGameTypeById(gameId);
        // isGameInitialized buradan da güncellenecek
        isGameInitialized = message.gameStarted;
    } else if (message.type === 'resetQuiz' && $selfRole !== 'manager') {
        isGameInitialized = false; // Resetlendiğinde oyun başlamamış gibi davran
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
    sendDataToAllPeers({ type: 'chat', message: `Merhaba, benim ID'im: ${$selfPeerId}` });
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
</script>

<style>
  .container {
    max-width: 900px;
    margin: 2rem auto;
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    background-color: white;
  }
  .header {
    text-align: center;
    margin-bottom: 2rem;
  }
  .header h1 {
    color: #1a237e;
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  .header p {
    color: #424242;
    font-size: 1.1rem;
  }
  .status-info {
    margin-bottom: 1.5rem;
    padding: 0.8rem;
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
    margin-top: 2rem;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 8px;
    font-family: monospace;
    font-size: 0.85rem;
    color: #555;
  }
</style>

<div class="container">
  <header class="header">
    <h1>{t('smartTogetherTitle')}</h1>
    <p>{t('smartTogetherSubtitle')}</p>
  </header>

  <div class="status-info">
    {#if $selfPeerId}
      {t('yourPeerId')}: <span>{$selfPeerId}</span>
    {:else}
      {t('connectingToServer')}...
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
    <button on:click={() => sendDataToAllPeers({ type: 'chat', message: `Merhaba, benim ID'im: ${$selfPeerId}` })}>Test Mesajı Gönder</button>
  </div>
</div>