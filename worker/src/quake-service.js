import Quake from '../../ui/src/lib/quake.js';
import {getQuake, searchQuakes} from './geonet-api.js';

export function getService(env) {
    return env.QUAKE_SERVICE.get(env.QUAKE_SERVICE.idFromName('GEONET'));
}

export class QuakeService {
    constructor(state, env) {
        this.state = state;
        this.env = env;

        const clientConfig = {
            min_magnitude: this.env.MIN_MAGNITUDE,
            max_depth_km: this.env.MAX_DEPTH_KM,
            highlight_quakes_within: this.env.RECENT_QUAKE_POLL_TIME_MINUTES,
            search_within: this.env.QUAKE_CACHE_TTL_DAYS,
        };

        this.cache = new Map();
        this.recentQuakes = new Set();
        this.lastQueryTime = new Date();
        const ips = new Map();
        const stats = {
            connected_clients: 0,
            peak_connected_clients: 0,
            unique_connections: 0,
            peak_unique_connections: 0,
        };

        // todo replace io
        io.on('connection', socket => {
            stats.connected_clients++;
            if (stats.connected_clients > stats.peak_connected_clients) {
                stats.peak_connected_clients = stats.connected_clients;
            }
            const ip = socket.handshake.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
            if (ips.has(ip)) {
                ips.set(ip, ips.get(ip) + 1);
            } else {
                ips.set(ip, 1);
                stats.unique_connections++;
            }
            if (stats.unique_connections > stats.peak_unique_connections) {
                stats.peak_unique_connections = stats.unique_connections;
            }
            console.log('Client connected (' + ip + '). Unique/connections: ' + stats.unique_connections + '/' + stats.connected_clients + ' Peak: ' + stats.peak_unique_connections + '/' + stats.peak_connected_clients);
            socket.emit('config', clientConfig);
            io.emit('stats', stats);

            const socketRefreshInterval = setInterval(
                () => socket.emit('all_quakes', this.getAllQuakes()),
                this.env.FULL_REFRESH_INTERVAL_MINUTES * 60000,
            );
            socket.emit('all_quakes', this.getAllQuakes());
            socket.on('disconnect', () => {
                const ipCount = ips.get(ip);
                if (ipCount <= 1) {
                    ips.delete(ip);
                    stats.unique_connections--;
                } else {
                    ips.set(ip, ipCount - 1);
                }
                stats.connected_clients--;
                console.log('Client disconnected. Total clients: ' + stats.connected_clients + ' Peak: ' + stats.peak_connected_clients);
                clearInterval(socketRefreshInterval);
                io.emit('stats', stats);
            });
        });
    }

    async fetch(request) {
        // todo handle sockets here
        const url = new URL(request.url);

        // let value = await this.state.storage.get("value") || 0;
        // await this.state.storage.put("value", value);

        switch (url.pathname) {
            case '/sync_quakes':
                await this.syncQuakes();
                return new Response('mmkay', {status: 200});
        }

        return new Response('not found', {status: 404});
    }

    async syncQuakes() {
        let updatedQuakes;
        if (this.env.FULL_REFRESH_INTERVAL_MINUTES * 60000 > now - this.lastFullRefreshTime) {
            this.lastFullRefreshTime = new Date(); // todo this should go into storage, not be a local variable
            updatedQuakes = await this.queryAllQuakes();
        }
        else {
            updatedQuakes = await this.checkForNewQuakes();
        }


        this.syncUpdatedQuakes(updatedQuakes);
        this.refreshRecentQuakes();
        const oldQuakeIds = this.expireOldEarthquakes();
        this.syncRemovedQuakes(oldQuakeIds);
    }

    async queryAllQuakes() {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - this.env.QUAKE_CACHE_TTL_DAYS);
        return await this.queryQuakes(fromDate);
    }

    async checkForNewQuakes() {
        const fromDate = new Date(this.lastQueryTime.getTime() - this.env.QUAKE_SEARCH_TIME_MINUTES * 60000);
        return await this.queryQuakes(fromDate);
    }

    async queryQuakes(fromDate) {
        // todo put quakes into storage
        this.lastQueryTime = new Date();
        const quakes = await searchQuakes(fromDate, this.env.MIN_MAGNITUDE, this.env.MAX_DEPTH_KM);
        const updatedQuakes = [];
        for (const quake of quakes) {
            const cachedQuake = this.cache.has(quake.id) ? this.cache[quake.id] : null;
            if (!cachedQuake) {
                updatedQuakes.push(quake);
                this.cacheQuake(quake);
            } else if (!cachedQuake.equals(quake)) {
                cachedQuake.update(quake);
                updatedQuakes.push(cachedQuake);
            }
        }
        return updatedQuakes;
    }

    async refreshQuake(quake) {
        const quakeSearchPeriod = new Date(this.lastQueryTime.getTime() - this.env.QUAKE_SEARCH_TIME_MINUTES * 60000);
        if (quakeSearchPeriod < Date.parse(quake.time)) {
            return; // only poll this quake individually if it is not included in the search
        }

        // check if earthquake has expired
        if (!this.cache.has(quake.id)) {
            this.stopPollingQuake(quake, 'Expired.');
            return;
        }

        console.log(`Refreshing quake data for ${quake.id}`);
        const earthquake = await getQuake(quake.id, quake);
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

    getAllQuakes() {
        return this.cache;
    }

    cacheQuake(quake) {
        this.cache.set(quake.id, quake);
    }

    uncacheQuake(quake) {
        this.cache.delete(quake.id);
    }

    stopPollingQuake(quake, reason) {
        if (this.recentQuakes.has(quake)) {
            this.recentQuakes.delete(quake);
            console.log(`Stopped polling quake ${quake.id}: ${reason}`);
            return true;
        }
        return false;
    }

    refreshRecentQuakes() {
        const recentPeriod = Date.now() - this.env.RECENT_QUAKE_POLL_TIME_MINUTES * 60000;
        for (const quake of this.cache) {
            if (Date.parse(quake.time) < recentPeriod) {
                this.stopPollingQuake(quake, 'Outside polling period.');
            } else if (quake.quality !== 'best' && quake.quality !== 'deleted') {
                // only poll quakes that have not been reviewed
                // best/deleted means quake has been reviewed
                // quality property is set after querying the quake individually with refreshQuake()
                this.recentQuakes.add(quake);
            }
        }

        for (const quake of this.recentQuakes) {
            this.refreshQuake(quake);
        }
    }

    expireOldEarthquakes() {
        const oldQuakeIds = [];

        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - this.env.QUAKE_CACHE_TTL_DAYS);

        for (const quake of this.cache) {
            if (quake.time < fromDate) {
                oldQuakeIds.push(id);
                this.uncacheQuake(quake);
            }
        }

        if (oldQuakeIds.length) {
            console.log('Earthquakes have expired: ' + oldQuakeIds.join(', '));
        }

        return oldQuakeIds;
    }

    syncUpdatedQuakes(quakes) {
        if (!quakes.length) {
            return;
        }
        this.emit('new_quakes', quakes)
    }

    syncRemovedQuakes(ids) {
        if (!ids.length) {
            return;
        }
        this.emit('old_quakes', ids)
    }

    emit(event, data) {
        // todo broadcast to all sockets
    }
}