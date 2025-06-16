<!-- SmartKontrol.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { t,getLanguage } from '$lib/lang';
  import { createMapFromSplitData, splitDataByLevel } from '$lib/utils';
  import { v4 as uuidv4 } from 'uuid'; // SmartControl için benzersiz ID
    import JSON5 from 'json5';
  // Alt bileşenleri import edin
  import ClientSelectionPanel from './ClientSelectionPanel.svelte';
  import ControlOperationsPanel from './ControlOperationsPanel.svelte';
  import { chatStore } from '$lib/Stores/chatStore'; // chatStore'u import edin
  import { currentLanguage } from '$lib/Stores/LangStores';

  export let value: string;

  let title = '';
  const serverUrl = 'http://localhost:3000';
  const wsServerUrl = 'ws://localhost:3000';

  const SMART_CONTROL_ID = uuidv4();
  console.log(`SmartControl instance ID: ${SMART_CONTROL_ID}`);

  // Tüm bu değişkenler SmartKontrol.svelte'in state'i olacak
  let clients: Array<{ id: string; metadata: any }> = [];
  let selectedClientId: string | null = null;
  let documentation: string | null = null;
  let commandCode: string = '';
  let operationFeedback: string | null = null;
  let operationResultData: any = null;

  let clientWs: WebSocket | null = null;

  // Yeni state değişkenleri
  let controlType: 'showList' | 'operation' | null = null;
  let initialCommandCode: string = ''; // Başlangıç komut kodu için
  let targetApp: string | null = null; // Yeni: Hangi uygulamaya gönderileceği bilgisi

  // `value` prop'u değiştiğinde reaktif olarak çalışır
  $: {
    try {
      const splitData = splitDataByLevel(value, 0);
      const valuesDatas = createMapFromSplitData(splitData, 1);
      title = valuesDatas.get('title') ||  t('smartControlPanelText');

      // value'dan controlType, app ve initialCommandCode'u oku
      const typeValue = valuesDatas.get('type');
      if (typeValue === 'showList' || typeValue === 'operation') {
        controlType = typeValue;
      } else {
        controlType = null; // Tanımsız tip
      }

      targetApp = valuesDatas.get('app') || null; // Yeni: app bilgisini oku

      const codeValue = valuesDatas.get('code');
      if (controlType === 'operation' && codeValue) {
        // Eğer code bir JSON string ise, formatlı bir şekilde ata
        try {
          const parsedCode = JSON.parse(codeValue);
          initialCommandCode = JSON.stringify(parsedCode, null, 2);
        } catch (e) {
          console.warn("Invalid JSON in 'code' field, using raw string.", e);
          initialCommandCode = codeValue; // Geçersiz JSON ise ham string olarak kullan
        }
        // commandCode'u sadece ilk yüklemede veya tip 'operation' iken güncelle
        // Kullanıcı manuel olarak commandCode'u değiştirmişse üzerine yazmamalıyız.
        if (commandCode === '' || commandCode === initialCommandCode) {
          commandCode = initialCommandCode;
        }
      } else {
        initialCommandCode = '';
        if (controlType !== 'operation') {
          // Eğer 'operation' tipi değilse komutu sıfırla
          commandCode = '';
        }
      }
    } catch (err) {
      console.error('Error parsing SmartControl value:', err);
      title = 'Akıllı Kontrol Paneli (Hata)';
      controlType = null; // Hata durumunda tipi sıfırla
      targetApp = null; // Hata durumunda sıfırla
    }
  }

  onMount(() => {
    clientWs = new WebSocket(wsServerUrl);

    clientWs.onopen = () => {
      console.log('SmartControl WebSocket connected to server.');
      clientWs?.send(
        JSON.stringify({
          type: 'REGISTER_SMART_CONTROL',
          id: SMART_CONTROL_ID
        })
      );
    };

    clientWs.onmessage = (event) => {
      const data = JSON.parse(event.data.toString());
      console.log('SmartControl received WS message:', data);

      switch (data.type) {
        case 'CLIENT_LIST_UPDATE':
          clients = data.payload;
          if (selectedClientId && !clients.some((c) => c.id === selectedClientId)) {
            resetSelectedClientState(); // Seçili client listeden çıktığında state'i sıfırla
          }
          break;
        case 'DOCUMENTATION_UPDATE':
          
            // Dökümantasyon verisinin tipi önemli. Eğer objeyse string'e çevir.
            const docs =
              typeof data.payload.docs === 'object' && data.payload.docs !== null
                ? JSON.stringify(data.payload.docs, null, 2)
                : String(data.payload.docs || '');
            documentation = docs;
            operationFeedback = `Dökümantasyon '${selectedClientId}' client'ından alındı.`;
            operationResultData = null;

            // Dökümantasyonu chatStore'a ekle (chatStore.addDocumationMessage() mevcut olmalı)
            chatStore.addDocumationMessage(documentation);
          break;
        case 'OPERATION_FEEDBACK':

          console.log(data.payload.requesterSmartControlId);
          console.log("SMART_CONTROL_ID",SMART_CONTROL_ID);
            operationFeedback =  t('successOperationMessage');

            let contentToDisplay;
            if (typeof data.payload.message === 'object' && data.payload.message !== null) {
              contentToDisplay = JSON.stringify(data.payload.message, null, 2);
            } else {
              contentToDisplay = String(data.payload.message || '');
            }

            operationResultData = {
              content: contentToDisplay
              //files: data.payload.files
            };

            // İşlem sonucunu chatStore'a ekle (chatStore.addOperationFeedbackMessage() mevcut olmalı)
           // chatStore.addOperationFeedbackMessage(operationFeedback, operationResultData);
          
          break;
        default:
          console.log('Unknown WS message type for SmartControl:', data.type);
      }
    };

    clientWs.onclose = () => console.log('SmartControl WebSocket disconnected from server.');
    clientWs.onerror = (err) => console.error('SmartControl WebSocket error:', err);

    return () => {
      clientWs?.close();
    };
  });

  // Alt bileşenlerden gelen olayları işleyen fonksiyonlar
  function handleSelectClient(event: CustomEvent<{ clientId: string }>) {
    console.log('SmartKontrol: handleSelectClient received event:', event.detail.clientId);
    selectedClientId = event.detail.clientId;
    resetSelectedClientState();
  }

  async function handleRequestDocumentation() {
    console.log('SmartKontrol: handleRequestDocumentation called.');
    if (!selectedClientId) {
      alert('Lütfen bir uygulama seçin.');
      console.warn('SmartKontrol: Request Documentation called but selectedClientId is null.');
      return;
    }
    documentation = 'Dökümantasyon isteniyor...';
    operationFeedback = null;
    operationResultData = null;
    try {
      const response = await fetch(`${serverUrl}/request-documentation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          lang:getLanguage(),
          requesterSmartControlId: SMART_CONTROL_ID
        })
      });
      const data = await response.json();
      if (data.success) {
        // Dökümantasyonun WS üzerinden geleceği için burada doğrudan `documentation`'ı güncellemiyoruz.
        // Ancak isteğin başarılı olduğunu gösterebiliriz.
        console.log('SmartKontrol: Documentation request sent. Server response:', data);
      } else {
        operationFeedback = `Dökümantasyon isteği başarısız: ${data.message}`;
        documentation = null;
        chatStore.addMessage(
          `Client '${selectedClientId}' için dökümantasyon isteği başarısız oldu: ${data.message}`
        );
      }
    } catch (error) {
      console.error('SmartKontrol: Error requesting documentation:', error);
      operationFeedback = `Dökümantasyon isteği gönderilemedi: ${error.message}`;
      documentation = null;
      chatStore.addMessage(
        `Client '${selectedClientId}' için dökümantasyon isteği gönderilemedi: ${error.message}`
      );
    }
  }


  function handleSendCommand(event: CustomEvent<{ code: string }>) {
    commandCode = event.detail.code;
    // Butonun her zaman açık olması istendiği için, selectedClientId zorunluluğu kalktı.
    // Sadece commandCode boşsa uyarı veriyoruz.
    if (!commandCode) {
      alert('Lütfen bir komut kodu girin.');
      return;
    }
    operationFeedback = 'Komut gönderiliyor...';
    operationResultData = null;
    try {
      let parsedCode;
      try {
        parsedCode = JSON5.parse(commandCode);
      } catch (e) {
        operationFeedback = 'Hata: Girilen komut geçerli bir JSON formatında değil.';
        chatStore.addMessage(`Hata: Geçersiz JSON komutu girildi: ${commandCode}`); // Chate de hata ekle
        return;
      }

      // Komut gönderme işlemini chat'e bildirin
      /*const clientInfo = selectedClientId ? `'${selectedClientId}'` : 'bir client seçili değil';
      const appInfo = targetApp ? `'${targetApp}' uygulamasında` : 'belirtilen bir uygulamada';
      chatStore.addMessage(
        `Client ${clientInfo} üzerinde ${appInfo} komut çalıştırılıyor:\n\`\`\`json\n${commandCode}\n\`\`\``
      );*/

      fetch(`${serverUrl}/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId, // null olabilir
          code: parsedCode,
          requesterSmartControlId: SMART_CONTROL_ID,
          targetApp: targetApp // Yeni: targetApp'i gönder
        })
      })
        .then((response) => response.json())
        .then((data) => {
            
          if (!data.success) {
            operationFeedback = `Kod gönderme başarısız: ${data.message}`;
            chatStore.addMessage(`Komut gönderme başarısız oldu: ${data.message}`); // Chate hata ekle
          }
          // Başarılı durumda sonucun WS üzerinden geleceği bekleniyor.
        })
        .catch((error) => {
          console.error('Error sending code:', error);
          operationFeedback = `Komut gönderilemedi: ${error.message}`;
          chatStore.addMessage(`Komut gönderilemedi: ${error.message}`); // Chate hata ekle
        });
    } catch (error) {
      console.error('Unexpected error in sendCommand:', error);
      operationFeedback = `Beklenmedik bir hata oluştu: ${error.message}`;
      chatStore.addMessage(`Beklenmedik bir hata oluştu: ${error.message}`); // Chate hata ekle
    }

  }

  // Seçili client durumu değiştiğinde ilgili state'leri sıfırlayan yardımcı fonksiyon
  function resetSelectedClientState() {
    documentation = null;
    if (controlType !== 'operation') {
      commandCode = '';
    } else {
      commandCode = initialCommandCode; // 'operation' tipinde ise varsayılanı geri yükle
    }
    operationFeedback = null;
    operationResultData = null;
  }
</script>

<div class="smart-control-container">
  <h2>{title}</h2>

  {#if controlType === 'showList'}
    <!-- Client Seçim Paneli -->
    <ClientSelectionPanel
      {clients}
      {selectedClientId}
      on:selectClient={handleSelectClient}
      on:requestDocumentation={handleRequestDocumentation}
    />
  {:else if controlType === 'operation'}
    <!-- Kontrol İşlemleri Paneli -->
    <ControlOperationsPanel
      {selectedClientId}
      {documentation}
      bind:commandCode
      {operationFeedback}
      {operationResultData}
      {targetApp} 
      on:sendCommand={handleSendCommand}
    />
  {:else}
    <p>Geçersiz kontrol tipi belirtildi veya değer parse edilirken bir hata oluştu.</p>

  {/if}
</div>

<style>
  .smart-control-container {
    max-width: 800px;
    margin: 0.25rem auto;
    padding: 0.5rem;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    background-color: #fff;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
  }
  h2 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-size: 1.5em;
  }
</style>