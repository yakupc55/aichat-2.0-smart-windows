// $lib/p2p.ts
import { writable, get } from 'svelte/store';

export const selfPeerId = writable<string | null>(null);
export const selfRole = writable<'manager' | 'manager-player' | 'participant' | 'viewer'>('viewer'); // selfRole type güncellendi
export const connectedPeers = writable<Map<string, RTCPeerConnection>>(new Map());
export const dataChannels = writable<Map<string, RTCDataChannel>>(new Map());
export const receivedMessages = writable<string[]>([]);
export const currentRoomId = writable<string | null>(null);

// Yeni eklenecekler
export const selfUserName = writable<string>(''); // Kullanıcının belirlediği isim
// Diğer eşlerin isimlerini tutacak map: peerId -> userName
export const peerUserNames = writable<Map<string, string>>(new Map());

let signalingSocket: WebSocket | null = null;
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

function sendSignal(targetPeerId: string, payload: any) {
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
        signalingSocket.send(JSON.stringify({
            type: 'signal',
            targetPeerId: targetPeerId,
            payload: payload
        }));
    } else {
        console.warn('Sinyalizasyon soketi bağlı değil, sinyal gönderilemedi.');
    }
}

async function createPeerConnection(targetPeerId: string, isInitiator: boolean) {
    console.log(`PeerConnection oluşturuluyor: ${targetPeerId}, Initiator: ${isInitiator}`);
    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log(`ICE Adayı gönderiliyor (${targetPeerId}):`, event.candidate);
            sendSignal(targetPeerId, { candidate: event.candidate });
        }
    };

    peerConnection.onconnectionstatechange = () => {
        console.log(`P2P Bağlantı Durumu (${targetPeerId}):`, peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
            console.log(`P2P bağlantısı başarılı: ${targetPeerId}`);
            // Bağlantı kurulduğunda kendi ismimizi karşı tarafa gönderelim
            const myUserName = get(selfUserName);
            if (myUserName) {
                sendDataToPeer(targetPeerId, { type: 'userNameUpdate', peerId: get(selfPeerId), userName: myUserName });
            }
            window.dispatchEvent(new CustomEvent('p2pPeerConnected', { detail: { peerId: targetPeerId } }));
        } else if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
            console.warn(`P2P bağlantısı koptu/başarısız: ${targetPeerId}`);
            removePeer(targetPeerId);
        }
    };

    peerConnection.ondatachannel = event => {
        console.log(`DataChannel alınıyor: ${event.channel.label} (${targetPeerId})`);
        const channel = event.channel;
        channel.onmessage = e => {
            const parsedMessage = JSON.parse(e.data);
            receivedMessages.update(msgs => [...msgs, `[${targetPeerId}]: ${e.data}`]);
            
            // Eğer gelen mesaj bir isim güncellemesiyse store'u güncelle
            if (parsedMessage.type === 'userNameUpdate' && parsedMessage.peerId && parsedMessage.userName) {
                peerUserNames.update(map => {
                    map.set(parsedMessage.peerId, parsedMessage.userName);
                    return map;
                });
                console.log(`Kullanıcı adı güncellendi: ${parsedMessage.peerId} -> ${parsedMessage.userName}`);
            }

            window.dispatchEvent(new CustomEvent('p2pMessage', { detail: { senderPeerId: targetPeerId, message: parsedMessage } }));
        };
        channel.onopen = () => console.log(`DataChannel açıldı (${targetPeerId})`);
        channel.onclose = () => {
            console.log(`DataChannel kapandı (${targetPeerId})`);
            removePeer(targetPeerId);
        };
        dataChannels.update(map => { map.set(targetPeerId, channel); return map; });
    };

    if (isInitiator) {
        const dataChannel = peerConnection.createDataChannel('game_data_channel');
        dataChannel.onmessage = e => {
            const parsedMessage = JSON.parse(e.data);
            receivedMessages.update(msgs => [...msgs, `[${targetPeerId}]: ${e.data}`]);
            
            // Eğer gelen mesaj bir isim güncellemesiyse store'u güncelle
            if (parsedMessage.type === 'userNameUpdate' && parsedMessage.peerId && parsedMessage.userName) {
                peerUserNames.update(map => {
                    map.set(parsedMessage.peerId, parsedMessage.userName);
                    return map;
                });
                console.log(`Kullanıcı adı güncellendi: ${parsedMessage.peerId} -> ${parsedMessage.userName}`);
            }

            window.dispatchEvent(new CustomEvent('p2pMessage', { detail: { senderPeerId: targetPeerId, message: parsedMessage } }));
        };
        dataChannel.onopen = () => {
            console.log(`DataChannel açıldı (initiator ${targetPeerId})`);
            // Initiator olarak bağlantı açıldığında kendi ismimizi karşı tarafa gönderelim
            const myUserName = get(selfUserName);
            if (myUserName) {
                dataChannel.send(JSON.stringify({ type: 'userNameUpdate', peerId: get(selfPeerId), userName: myUserName }));
            }
        };
        dataChannel.onclose = () => {
            console.log(`DataChannel kapandı (initiator ${targetPeerId})`);
            removePeer(targetPeerId);
        };
        dataChannels.update(map => { map.set(targetPeerId, dataChannel); return map; });
    }

    connectedPeers.update(map => { map.set(targetPeerId, peerConnection); return map; });
    return peerConnection;
}

function removePeer(peerIdToRemove: string) {
    connectedPeers.update(map => {
        const peer = map.get(peerIdToRemove);
        if (peer) {
            peer.close();
            map.delete(peerIdToRemove);
            console.log(`Peer bağlantısı kaldırıldı: ${peerIdToRemove}`);
        }
        return map;
    });
    dataChannels.update(map => {
        map.delete(peerIdToRemove);
        console.log(`DataChannel kaldırıldı: ${peerIdToRemove}`);
        return map;
    });
    peerUserNames.update(map => { // Ayrılan oyuncunun ismini sil
        map.delete(peerIdToRemove);
        return map;
    });
    window.dispatchEvent(new CustomEvent('p2pPlayerLeft', { detail: { peerId: peerIdToRemove } }));
}


// --- Public API ---

export function connectSignalingServer(url: string) {
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
        console.warn('Sinyalizasyon sunucusu zaten bağlı.');
        return;
    }

    signalingSocket = new WebSocket(url);

    signalingSocket.onopen = () => {
        console.log('Sinyalizasyon sunucusuna bağlandı.');
        // Bağlandığımızda eğer zaten bir kullanıcı adı belirlenmişse sunucuya gönderelim
        if (get(selfUserName)) {
            signalingSocket?.send(JSON.stringify({ type: 'setUserName', userName: get(selfUserName) }));
        }
    };

    signalingSocket.onmessage = async event => {
        const message = JSON.parse(event.data);
        console.log('Sunucudan sinyal mesajı:', message);

        switch (message.type) {
            case 'yourPeerId':
                selfPeerId.set(message.peerId);
                // Kendi peerId'mizi aldığımızda kendi userName'imizi de peerUserNames map'ine ekleyelim
                if (get(selfUserName)) {
                    peerUserNames.update(map => {
                        map.set(message.peerId, get(selfUserName));
                        return map;
                    });
                }
                break;
            case 'roomCreated':
                currentRoomId.set(message.roomId);
                selfRole.set(message.yourRole);
                window.dispatchEvent(new CustomEvent('p2pRoomStatus', { detail: { type: 'roomCreated', roomId: message.roomId, role: message.yourRole } }));
                console.log(`Oda oluşturuldu. Kendi Peer ID'niz: ${message.yourPeerId}, Rolünüz: ${message.yourRole}`);
                break;
            case 'roomJoined':
                currentRoomId.set(message.roomId);
                selfRole.set(message.yourRole);
                window.dispatchEvent(new CustomEvent('p2pRoomStatus', { detail: { type: 'roomJoined', roomId: message.roomId, role: message.yourRole } }));
                console.log(`Odaya katılım başarılı. Kendi Peer ID'niz: ${message.yourPeerId}, Rolünüz: ${message.yourRole}`);
                
                // Odaya katıldığımızda, diğer mevcut oyuncuların isimlerini de almalıyız
                // Bu bilgiyi server'dan veya P2P bağlantısı kurulunca diğer eşlerden alacağız.
                // Şimdilik server'dan gelen currentPlayers mesajına userName ekleyeceğiz.
                break;
            case 'currentPlayers':
                const currentClientPeerId = get(selfPeerId);
                for (const playerInfo of message.players) { // players artık {peerId, userName} objeleri içerecek
                    if (playerInfo.peerId !== currentClientPeerId) {
                        console.log(`Mevcut oyuncu bulundu: ${playerInfo.peerId} (${playerInfo.userName || 'Bilinmeyen'}). P2P bağlantısı teklif ediliyor...`);
                        peerUserNames.update(map => { // Gelen isimleri kaydet
                            map.set(playerInfo.peerId, playerInfo.userName);
                            return map;
                        });
                        const peer = await createPeerConnection(playerInfo.peerId, true);
                        const offer = await peer.createOffer();
                        await peer.setLocalDescription(offer);
                        sendSignal(playerInfo.peerId, { sdp: peer.localDescription });
                    }
                }
                break;
            case 'newPlayerJoined':
                console.log(`Yeni oyuncu katıldı: ${message.peerId} (${message.userName || 'Bilinmeyen'}). P2P bağlantısı bekleniyor (responder)...`);
                peerUserNames.update(map => { // Yeni katılan oyuncunun ismini kaydet
                    map.set(message.peerId, message.userName);
                    return map;
                });
                const peer = await createPeerConnection(message.peerId, false);
                break;
            case 'userNameUpdatedFromServer': // Sunucudan gelen kendi isim güncelleme onayı
                peerUserNames.update(map => {
                    map.set(get(selfPeerId)!, message.userName);
                    return map;
                });
                break;
            case 'signal':
                const senderPeerId = message.senderPeerId;
                const peerConnection = get(connectedPeers).get(senderPeerId) || await createPeerConnection(senderPeerId, false);

                if (message.payload.sdp) {
                    console.log(`SDP alınıyor (${senderPeerId}):`, message.payload.sdp.type);
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.payload.sdp));

                    if (message.payload.sdp.type === 'offer') {
                        const answer = await peerConnection.createAnswer();
                        await peerConnection.setLocalDescription(answer);
                        sendSignal(senderPeerId, { sdp: peerConnection.localDescription });
                    }
                } else if (message.payload.candidate) {
                    console.log(`ICE Adayı alınıyor (${senderPeerId}):`, message.payload.candidate);
                    try {
                        await peerConnection.addIceCandidate(new RTCIceCandidate(message.payload.candidate));
                    } catch (e) {
                        console.error('ICE adayı eklenirken hata:', e);
                    }
                }
                break;
            case 'error':
                console.error('Sunucudan hata:', message.message);
                alert('Sunucudan hata:'+ message.message);
                window.dispatchEvent(new CustomEvent('p2pError', { detail: { message: message.message } }));
                break;
            case 'playerLeft':
            case 'roomClosed':
                console.log(`Oyuncu ayrıldı: ${message.peerId || 'Bilinmeyen'} / Oda kapandı: ${message.roomId || 'Bilinmeyen'}`);
                if (message.peerId) {
                    removePeer(message.peerId);
                } else {
                    get(connectedPeers).forEach(pc => pc.close());
                    connectedPeers.set(new Map());
                    dataChannels.set(new Map());
                    currentRoomId.set(null);
                    selfRole.set('viewer');
                    peerUserNames.set(new Map()); // Oda kapanınca tüm isimleri temizle
                    window.dispatchEvent(new CustomEvent('p2pRoomStatus', { detail: { type: 'roomClosed', roomId: message.roomId || 'N/A' } }));
                }
                break;
        }
    };

    signalingSocket.onclose = () => {
        console.log('Sinyalizasyon sunucusu bağlantısı kesildi.');
        selfPeerId.set(null);
        currentRoomId.set(null);
        selfRole.set('viewer');
        selfUserName.set(''); // Kendi ismini de temizle
        peerUserNames.set(new Map()); // Tüm isimleri temizle
        get(connectedPeers).forEach(pc => pc.close());
        connectedPeers.set(new Map());
        dataChannels.set(new Map());
        receivedMessages.set([]);
        window.dispatchEvent(new CustomEvent('p2pDisconnected'));
    };

    signalingSocket.onerror = error => {
        console.error('Sinyalizasyon soket hatası:', error);
        window.dispatchEvent(new CustomEvent('p2pError', { detail: { message: 'Sinyalizasyon soketi hatası: ' + error.message } }));
    };
}

export function createRoom(roomId?: string, gameId?: string, password?: string) {
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
        signalingSocket.send(JSON.stringify({ 
            type: 'createRoom', 
            roomId, 
            gameId, 
            password,
            userName: get(selfUserName) // Kullanıcı adını da gönder
        }));
    }
}

export function joinRoom(roomId: string, password?: string) {
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
        signalingSocket.send(JSON.stringify({ 
            type: 'joinRoom', 
            roomId, 
            password,
            userName: get(selfUserName) // Kullanıcı adını da gönder
        }));
    }
}

export function sendDataToPeer(targetPeerId: string, message: any) {
    const channel = get(dataChannels).get(targetPeerId);
    if (channel && channel.readyState === 'open') {
        channel.send(JSON.stringify(message));
    } else {
        console.warn(`DataChannel (${targetPeerId}) kapalı, mesaj gönderilemedi.`);
    }
}

export function sendDataToAllPeers(message: any) {
    const channels = get(dataChannels);
    channels.forEach(channel => {
        if (channel.readyState === 'open') {
            channel.send(JSON.stringify(message));
        } else {
            console.warn(`DataChannel (${channel.label}) kapalı, mesaj gönderilemedi.`);
        }
    });
}

export function disconnectP2P() {
    if (signalingSocket) {
        signalingSocket.close();
        signalingSocket = null;
    }
    get(connectedPeers).forEach(pc => pc.close());
    connectedPeers.set(new Map());
    dataChannels.set(new Map());
    selfPeerId.set(null);
    currentRoomId.set(null);
    selfRole.set('viewer');
    selfUserName.set(''); // Kendi ismini de temizle
    peerUserNames.set(new Map()); // Tüm isimleri temizle
    window.dispatchEvent(new CustomEvent('p2pDisconnected'));
}

// Yeni eklenen fonksiyon: Kullanıcı adını ayarla ve sunucuya bildir
export function setUserName(name: string) {
    selfUserName.set(name);
    // Peer ID zaten ayarlıysa ve sunucuya bağlıysak hemen sunucuya bildir
    if (get(selfPeerId) && signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
        signalingSocket.send(JSON.stringify({ type: 'setUserName', userName: name }));
    }
    // Kendi ismimizi de peerUserNames map'ine ekle
    if (get(selfPeerId)) {
        peerUserNames.update(map => {
            map.set(get(selfPeerId)!, name);
            return map;
        });
    }
}