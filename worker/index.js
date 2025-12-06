import { QuakeService } from './QuakeService.js';

export { QuakeService };

export default {
    async fetch(request, env, ctx) {
        try {
            // Get the Durable Object instance
            const id = env.QUAKE_SERVICE.idFromName("global");
            const stub = env.QUAKE_SERVICE.get(id);
            return await stub.fetch(request);
        } catch (e) {
            console.error('Worker fetch error:', e);
            return new Response(e.message || String(e), { status: 500 });
        }
    },

    async scheduled(event, env, ctx) {
        ctx.waitUntil((async () => {
            try {
                // Get the Durable Object instance
                const id = env.QUAKE_SERVICE.idFromName("global");
                const stub = env.QUAKE_SERVICE.get(id);

                // Trigger sync via internal request
                return await stub.fetch(new Request('https://internal/sync_quakes'));
            } catch (e) {
                console.error('Scheduled job error:', e.message, e.stack);
                return new Response(e.message || String(e), { status: 500 });
            }
        })());
    },
};
