const messageCallbacks = new Set();
const reconnectMaxIntervalSeconds = 3600;
const reconnectBackoffFactor = 1.5;
const healthCheckTimeoutMs = 300000;
let reconnectAttempts = 0;
let reconnectTimeout;
let socket;
let lastMessageTime;
let healthCheckInterval;

export function addSocketListener(onMessage) {
    messageCallbacks.add(onMessage);
    return onMessage;
}

export function removeSocketListener(onMessage) {
    messageCallbacks.remove(onMessage);
}

export function handleMessage(message) {
    const [event, data] = message;
    if (event == 'ping') {
        const now = Date.now();
        sendMessage('pong', {then: data, now, diff: now - data});
        return;
    }
    if (event == 'pong') {
        return;
    }
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
    disconnectSocket();
    try {
        const url = new URL(window.location);
        host = host ?? url.host;
        const hostUrl = (url.protocol === 'http:' ? 'ws://' : 'wss://') + host + '/session';
        socket = new WebSocket(hostUrl);
        socket.addEventListener('open', () => {
            cancelReconnect();
            clearInterval(healthCheckInterval);
            setInterval(() => {
                const now = Date.now();
                if (now - lastMessageTime > healthCheckTimeoutMs) {
                    sendMessage('ping', now);
                }
            }, healthCheckTimeoutMs);
            handleMessage(['open', null]);
        });
        socket.addEventListener('message', event => {
            lastMessageTime = Date.now();
            handleMessage(JSON.parse(event.data));
        });
        socket.addEventListener('error', event => {
            handleMessage(['error', event]);
            disconnectSocket();
            console.log('Socket error, reconnecting...', event);
            reconnectSocket(hostUrl);
        });
        socket.addEventListener('close', () => {
            handleMessage(['close', null]);
            disconnectSocket();
            console.log('socket closed...');
        });
        return true;
    } catch (err) {
        console.error('WS connection failed:', host, err);
        return false;
    }
}

export function sendMessage(event, data) {
    if (!socket) return false;
    try {
        socket.send(JSON.stringify([event, data]));
        lastMessageTime = Date.now();
        return true;
    } catch (err) {
        console.error(err);
    }
    return false;
}

function disconnectSocket() {
    try {
        if (socket) {
            socket.close();
        }
    } catch (err) {
        console.error('error while closing socket', err);
    }
    socket = null;
    clearInterval(healthCheckInterval);
}

function reconnectSocket(host) {
    if (socket) {
        cancelReconnect();
        return;
    }
    reconnectAttempts++;
    console.log('Attempting to reconnect to:', reconnectAttempts);
    reconnectTimeout = setTimeout(() => {
        if (!connectSocket(host)) {
            reconnectSocket(host);
        }
    }, Math.min(reconnectMaxIntervalSeconds, Math.pow(reconnectAttempts, reconnectBackoffFactor)) * 1000);

}

function cancelReconnect() {
    reconnectAttempts = 0;
    clearTimeout(reconnectTimeout);
}
