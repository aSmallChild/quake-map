export async function onRequest(context) {
    const { request, env } = context;
    const id = env.QUAKE_SERVICE.idFromName('global');
    const stub = env.QUAKE_SERVICE.get(id);
    // Forward the original request so the DO handles the websocket upgrade
    return stub.fetch(request);
}
