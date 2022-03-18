import {getService, QuakeService} from './quake-service.js';

export default {
  QuakeService,
  async fetch(request, env) {
    try {
      const service = getService(env);
      return await service.fetch(request.url);
    } catch (e) {
      console.error(e);
      return new Response(e.message, {status: 500})
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const service = getService(env);
        return await service.fetch('/sync_quakes');
      } catch (e) {
        console.error(e);
        return new Response(e.message, {status: 500})
      }
    })());
  },
}