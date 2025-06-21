// $lib/p2p.ts
import { writable, get } from 'svelte/store';

export const selfPeerId = writable<string | null>(null);
export const selfRole = writable<'manager' | 'participant' | 'viewer'>('viewer');
export const connectedPeers = writable<Map<string, RTCPeerConnection>>(new Map());
export const dataChannels = writable<Map<string, RTCDataChannel>>(new Map());
export const receivedMessages = writable<string[]>([]);
export const currentRoomId = writable<string | null>(null);

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
            receivedMessages.update(msgs => [...msgs, `[${targetPeerId}]: ${e.data}`]);
            window.dispatchEvent(new CustomEvent('p2pMessage', { detail: { senderPeerId: targetPeerId, message: JSON.parse(e.data) } }));
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
            receivedMessages.update(msgs => [...msgs, `[${targetPeerId}]: ${e.data}`]);
            window.dispatchEvent(new CustomEvent('p2pMessage', { detail: { senderPeerId: targetPeerId, message: JSON.parse(e.data) } }));
        };
        dataChannel.onopen = () => console.log(`DataChannel açıldı (initiator ${targetPeerId})`);
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
    };

    signalingSocket.onmessage = async event => {
        const message = JSON.parse(event.data);
        console.log('Sunucudan sinyal mesajı:', message);

        switch (message.type) {
            case 'yourPeerId':
                selfPeerId.set(message.peerId);
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
                break;
            case 'currentPlayers':
                const currentClientPeerId = get(selfPeerId);
                for (const playerPeerId of message.players) {
                    if (playerPeerId !== currentClientPeerId) {
                        console.log(`Mevcut oyuncu bulundu: ${playerPeerId}. P2P bağlantısı teklif ediliyor...`);
                        const peer = await createPeerConnection(playerPeerId, true);
                        const offer = await peer.createOffer();
                        await peer.setLocalDescription(offer);
                        sendSignal(playerPeerId, { sdp: peer.localDescription });
                    }
                }
                break;
            case 'newPlayerJoined':
                console.log(`Yeni oyuncu katıldı: ${message.peerId}. P2P bağlantısı bekleniyor (responder)...`);
                const peer = await createPeerConnection(message.peerId, false);
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
        signalingSocket.send(JSON.stringify({ type: 'createRoom', roomId, gameId, password }));
    }
}

export function joinRoom(roomId: string, password?: string) {
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
        signalingSocket.send(JSON.stringify({ type: 'joinRoom', roomId, password }));
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
    window.dispatchEvent(new CustomEvent('p2pDisconnected'));
}