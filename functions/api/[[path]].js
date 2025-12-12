export async function onRequest(context) {
    const {
        request,
        env,
    } = context;
    const id = env.QUAKE_SERVICE.idFromName("global");
    const stub = env.QUAKE_SERVICE.get(id);
    return stub.fetch(request);
}
