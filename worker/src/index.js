import getLatestQuakes from './get-latest-quakes.js';
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
    ctx.waitUntil(getLatestQuakes(event, env));
  },
}