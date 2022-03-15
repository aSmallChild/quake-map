import Quake from '../../ui/src/lib/quake.js';
import {getQuake, searchQuakes} from './geonet-api.js';

export function getService(env) {
    return env.QUAKE_SERVICE.get(env.QUAKE_SERVICE.idFromName('GEONET'));
}

export class QuakeService {
    constructor(state, env) {
        this.state = state;
    }

    // Handle HTTP requests from clients.
    async fetch(request) {

        // todo handle sockets here
        const url = new URL(request.url);

        // let value = await this.state.storage.get("value") || 0;
        // await this.state.storage.put("value", value);

        switch (url.pathname) {
            case "/set_quakes":
                ++value;
                break;
            case "/update_quakes":
                --value;
                break;
            case "/":
                // Just serve the current value.
                break;
            default:
                return new Response("Not found", {status: 404});
        }

        return new Response(value);
    }
}

// syncs earthquake data with clients
const asd = (server, geonet, stats) => {
    const io = new Server(server);
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
        console.log('Client connected (' + ip + '). Unique/connections: ' + stats.unique_connections + '/' + stats.connected_clients + ' Peak: ' + stats.peak_unique_connections + '/' + stats.peak_connected_clients);
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
            console.log('Client disconnected. Total clients: ' + stats.connected_clients + ' Peak: ' + stats.peak_connected_clients);
            clearInterval(socketRefreshInterval);
            io.emit('stats', stats);
        });
    });
}



// todo remove this
class QuakeServiceREMOVE {
    constructor(geonet, config, logger) {
        this.config = config;
        this.geonet = geonet;
        this.cache = {};
        this.recentQuakes = {};
        this.lastQueryTime = new Date();
        this.events = new EventEmitter();
    }

    getAllQuakes() {
        return this.cache;
    }

    queryAllQuakes() {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - this.config.quake_cache_ttl_days);
        // noinspection JSIgnoredPromiseFromCall
        this.queryQuakes(fromDate);
    }

    checkForNewQuakes() {
        const fromDate = new Date(this.lastQueryTime.getTime() - this.config.quake_search_time_minutes * 60000);
        // noinspection JSIgnoredPromiseFromCall
        this.queryQuakes(fromDate);
    }

    async queryQuakes(fromDate) {
        this.lastQueryTime = new Date();
        const quakes = await searchQuakes(fromDate, this.config.min_magnitude, this.config.max_depth_km);
        const updatedQuakes = [];
        for (const quake of quakes) {
            const cachedQuake = this.cache.hasOwnProperty(quake.id) ? this.cache[quake.id] : null;
            if (!cachedQuake) {
                updatedQuakes.push(quake);
                this.cacheQuake(quake);
            } else if (!cachedQuake.equals(quake)) {
                cachedQuake.update(quake);
                updatedQuakes.push(cachedQuake);
            }
        }
        this.syncUpdatedQuakes(updatedQuakes);
        this.refreshRecentQuakes();
    }

    async refreshQuake(quake) {
        const quakeSearchPeriod = new Date(this.lastQueryTime.getTime() - this.config.quake_search_time_minutes * 60000);
        if (quakeSearchPeriod < Date.parse(quake.time)) {
            return; // only poll this quake individually if it is not included in the search
        }

        // check if earthquake has expired
        if (!this.cache.hasOwnProperty(quake.id)) {
            this.stopPollingQuake(quake, 'Expired.');
            return;
        }

        console.log(`Refreshing quake data for ${quake.id}`);
        const earthquake = await getQuake(quake);
        if (!earthquake) {
            return;
        }

        if (earthquake.quality == 'deleted') {
            this.uncacheQuake(quake);
            this.stopPollingQuake(quake, 'Earthquake was deleted.');
            this.syncRemovedQuakes([quake.id]);
            return;
        } else if (!quake.equals(earthquake)) {
            quake.update(earthquake);
            this.syncUpdatedQuakes([quake]);
        }

        if (quake.quality == 'best') {
            this.stopPollingQuake(quake, 'Best quality/reviewed.');
        }
    }

    cacheQuake(quake) {
        this.cache[quake.id] = quake;
    }

    uncacheQuake(quake) {
        delete this.cache[quake.id];
    }

    stopPollingQuake(quake, reason) {
        if (this.recentQuakes.hasOwnProperty(quake.id)) {
            delete this.recentQuakes[quake.id];
            console.log(`Stopped polling quake ${quake.id}: ${reason}`);
            return true;
        }
        return false;
    }

    refreshRecentQuakes() {
        const recentPeriod = Date.now() - this.config.recent_quake_poll_time_minutes * 60000;
        for (const id in this.cache) {
            if (!this.cache.hasOwnProperty(id)) continue;
            const quake = this.cache[id];
            if (Date.parse(quake.time) < recentPeriod) {
                this.stopPollingQuake(quake, 'Outside polling period.');
            } else if (quake.quality !== 'best' && quake.quality !== 'deleted') {
                // only poll quakes that have not been reviewed
                // best/deleted means quake has been reviewed
                // quality property is set after querying the quake individually with refreshQuake()
                this.recentQuakes[quake.id] = quake;
            }
        }

        for (const id in this.recentQuakes) {
            this.refreshQuake(this.recentQuakes[id]);
        }
    }

    expireOldEarthquakes() {
        const oldQuakeIds = [];

        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - this.config.quake_cache_ttl_days);

        for (const id in this.cache) {
            if (!this.cache.hasOwnProperty(id)) continue;
            const quake = this.cache[id];
            if (quake.time < fromDate) {
                oldQuakeIds.push(id);
                this.uncacheQuake(quake);
            }
        }

        if (oldQuakeIds.length) {
            console.log('Earthquakes have expired: ' + oldQuakeIds.join(', '));
        }

        this.syncRemovedQuakes(oldQuakeIds);
        return oldQuakeIds;
    }

    onNewQuakes(listener) {
        this.events.on('updated_quakes', listener);
    }

    syncUpdatedQuakes(quakes) {
        if (!quakes.length) {
            return;
        }
        this.events.emit('updated_quakes', quakes);
    }

    onDeletedQuakeIds(listener) {
        this.events.on('removed_quake_ids', listener);
    }

    syncRemovedQuakes(ids) {
        if (!ids.length) {
            return;
        }
        this.events.emit('removed_quake_ids', ids);
    }
}