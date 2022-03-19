const messageCallbacks = new Set();
let socket;

export function addSocketListener(onMessage) {
    messageCallbacks.add(onMessage);
    return onMessage;
}

export function removeSocketListener(onMessage) {
    messageCallbacks.remove(onMessage);
}

export function handleMessage(message) {
    const [event, data] = message;
    for (const cb of messageCallbacks) {
        try {
            cb(event, data);
        } catch (err) {
            console.error('Error while handling message.');
            console.error(err);
        }
    }
}

export function connectSocket(host = import.meta.env.VITE_API_HOST) {
    if (socket) {
        socket.close();
    }
    const url = new URL(window.location);
    host = (url.protocol === 'http:' ? 'ws://' : 'wss://') + (host ?? url.host) + '/session';
    socket = new WebSocket(host);
    if (!socket) {
        throw new Error('WS connection failed: ', host);
    }
    socket.addEventListener('open', () => handleMessage(['open', null]));
    socket.addEventListener('message', event => handleMessage(JSON.parse(event.data)));
    socket.addEventListener('close', () => {
        socket.addEventListener('close', () => handleMessage(['open', null]));
        socket = null;
    });
}

export function sendMessage(event, data) {
    if (!socket) return false;
    try {
        socket.send(JSON.stringify([event, data]));
        return true;
    }
    catch (err) {
        console.error(err);
    }
    return false;
}