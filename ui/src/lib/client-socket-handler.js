const messageCallbacks = new Set();

export function addSocketListener(onMessage) {
    messageCallbacks.add(onMessage);
    return onMessage;
}

export function removeSocketListener(onMessage) {
    messageCallbacks.remove(onMessage);
}

export function onMessage(message) {
    const [event, data] = message;
    for (const cb of messageCallbacks) {
        try {
            cb(event, data);
        }
        catch (err) {
            console.error('Error while handling message.')
            console.error(err)
        }
    }
}