export default {
    async scheduled(event, env, ctx) {
        ctx.waitUntil((async () => {
            const id = env.QUAKE_SERVICE.idFromName("global");
            const stub = env.QUAKE_SERVICE.get(id);
            await stub.fetch(new Request('https://internal/sync_quakes'));
        })());
    }
};
