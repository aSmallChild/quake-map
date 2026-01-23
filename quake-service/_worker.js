import { QuakeService } from './QuakeService.js';

export { QuakeService };

export default {
    async fetch(request, env) {
        try {
            const id = env.QUAKE_SERVICE.idFromName('global');
            const stub = env.QUAKE_SERVICE.get(id);
            return await stub.fetch(request);
        }
        catch (e) {
            console.error('Worker fetch error:', e);
            return new Response(e.message || String(e), { status: 500 });
        }
    },

    async scheduled(event, env, ctx) {
        ctx.waitUntil((async () => {
            const id = env.QUAKE_SERVICE.idFromName('global');
            const stub = env.QUAKE_SERVICE.get(id);
            await stub.fetch(new Request('https://internal/sync_quakes'));
        })());
    }
};
