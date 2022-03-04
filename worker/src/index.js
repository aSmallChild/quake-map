export { Geonet } from './geonet.js'

export default {
  async fetch(request, env) {
    try {
      return await env.GEONET.get(env.GEONET.idFromName('GEONET')).fetch(request.url);
    } catch (e) {
      return new Response(e.message)
    }
  },
}
