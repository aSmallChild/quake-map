import fs from 'fs';
import express from 'express';
import http from 'http';

import QuakeService from './quake-service.js';
import Geonet from './geonet.js';
import sockets from './sockets.js';
import routes from './routes.js';

/** @param config.mapbox_access_token */
/** @param config.quake_search_time_minutes */
/** @param config.quake_cache_ttl_days */
/** @param config.recent_quake_poll_time_minutes */
/** @param config.http_port */
/** @param config.full_refresh_interval_minutes */
/** @param config.geonet_polling_interval_seconds */
const config = JSON.parse(fs.readFileSync('./config.json').toString());
if (!config) throw new Error('missing config');
for (const prop of ['google_maps_key', 'mapbox_access_token', 'min_magnitude', 'max_depth_km', 'quake_cache_ttl_days', 'geonet_polling_interval_seconds', 'full_refresh_interval_minutes', 'recent_quake_poll_time_minutes', 'quake_search_time_minutes', 'http_port']) {
    if (!config.hasOwnProperty(prop)) throw new Error(`config.${prop} is not defined`);
}

const logger = console;
const app = express();
// noinspection JSValidateTypes
const server = http.Server(app);
const geonet = new Geonet(logger);
const quakeService = new QuakeService(geonet, config, logger);
const stats = {
    connected_clients: 0,
    peak_connected_clients: 0,
    unique_connections: 0,
    peak_unique_connections: 0
};

routes(app, quakeService, stats, config);
sockets(server, quakeService, stats, config, logger);

server.listen(config.http_port, () => logger.log("Server listening on " + config.http_port + "."));

// poll geonet
quakeService.queryAllQuakes();
setInterval(() => quakeService.queryAllQuakes(), config.full_refresh_interval_minutes * 60000);
setInterval(() => {
    quakeService.expireOldEarthquakes();
    quakeService.checkForNewQuakes();
}, config.geonet_polling_interval_seconds * 1000);
