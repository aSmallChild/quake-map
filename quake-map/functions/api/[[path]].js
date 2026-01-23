export async function onRequest(context) {
    const {
        request,
        env,
    } = context;
    const id = env.QUAKE_SERVICE.idFromName('global');
    const stub = env.QUAKE_SERVICE.get(id);

    // Strip /api prefix
    const url = new URL(request.url);
    url.pathname = url.pathname.replace(/^\/api/, '');

    return stub.fetch(new Request(url.toString(), request));
}
