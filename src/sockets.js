// syncs earthquake data with clients
module.exports = (io, geonet, stats, config, logger) => {
    const ips = {};
    const clientConfig = {
        min_magnitude: config.min_magnitude,
        max_depth_km: config.max_depth_km,
        highlight_quakes_within: config.recent_quake_poll_time_minutes,
        search_within: config.quake_cache_ttl_days
    };

    geonet.onNewQuakes(quakes => io.emit('new_quakes', quakes));
    geonet.onDeletedQuakeIds(ids => io.emit('old_quakes', ids));
    io.on('connection', socket => {
        stats.connected_clients++;
        if (stats.connected_clients > stats.peak_connected_clients) {
            stats.peak_connected_clients = stats.connected_clients;
        }
        const ip = socket.handshake.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
        if (ips.hasOwnProperty(ip)) {
            ips[ip]++;
        } else {
            ips[ip] = 1;
            stats.unique_connections++;
        }
        if (stats.unique_connections > stats.peak_unique_connections) {
            stats.peak_unique_connections = stats.unique_connections;
        }
        logger.log('Client connected (' + ip + '). Unique/connections: ' + stats.unique_connections + '/' + stats.connected_clients + ' Peak: ' + stats.peak_unique_connections + '/' + stats.peak_connected_clients);
        socket.emit('config', clientConfig);
        io.emit('stats', stats);

        const socketRefreshInterval = setInterval(
            () => socket.emit('all_quakes', geonet.getAllQuakes()),
            config.full_refresh_interval_minutes * 60000
        );
        socket.emit('all_quakes', geonet.getAllQuakes());
        socket.on('disconnect', () => {
            ips[ip]--;
            if (ips[ip] < 1) {
                delete ips[ip];
                stats.unique_connections--;
            }
            stats.connected_clients--;
            logger.log('Client disconnected. Total clients: ' + stats.connected_clients + ' Peak: ' + stats.peak_connected_clients);
            clearInterval(socketRefreshInterval);
            io.emit('stats', stats);
        });
    });
}