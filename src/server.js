const fs = require('fs');
const server = require('express')();
// noinspection JSValidateTypes
const http = require('http').Server(server);
const io = require('socket.io')(http);
const Geonet = require('./geonet');
const sockets = require('./sockets');
const routes = require('./routes');

/** @param config.quake_search_time_minutes */
/** @param config.quake_cache_ttl_days */
/** @param config.recent_quake_poll_time_minutes */
/** @param config.http_port */
/** @param config.full_refresh_interval_minutes */
/** @param config.geonet_polling_interval_seconds */
const config = JSON.parse(fs.readFileSync('./config.json').toString());
if (!config) throw new Error('missing config');
for (const prop of ['google_maps_key', 'min_magnitude', 'max_depth_km', 'quake_cache_ttl_days', 'geonet_polling_interval_seconds', 'full_refresh_interval_minutes', 'recent_quake_poll_time_minutes', 'quake_search_time_minutes', 'http_port']) {
    if (!config.hasOwnProperty(prop)) throw new Error(`config.${prop} is not defined`);
}

const logger = console;
const geonet = new Geonet(config, logger);
const stats = {
    connected_clients: 0,
    peak_connected_clients: 0,
    unique_connections: 0,
    peak_unique_connections: 0
};

sockets(io, geonet, stats, config, logger);
routes(server, geonet, stats, config);

http.listen(config.http_port, () => logger.log("Server listening on " + config.http_port + "."));

// poll geonet
geonet.queryAllQuakes();
setInterval(() => geonet.queryAllQuakes(), config.full_refresh_interval_minutes * 60000);
setInterval(() => {
    geonet.expireOldEarthquakes();
    geonet.checkForNewQuakes();
}, config.geonet_polling_interval_seconds * 1000);
