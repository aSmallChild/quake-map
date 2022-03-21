import Quake from '../../ui/src/lib/quake.js';
import {getQuake, searchQuakes} from './geonet-api.js';

const sessionHealthCheckIntervalMs = 600000;

export function getService(env) {
    return env.QUAKE_SERVICE.get(env.QUAKE_SERVICE.idFromName('GEONET'));
}

export class QuakeService {
    constructor(state, env) {
        this.state = state;
        this.env = env;

        this.clientConfig = {
            min_magnitude: this.env.MIN_MAGNITUDE,
            max_depth_km: this.env.MAX_DEPTH_KM,
            highlight_quakes_within: this.env.RECENT_QUAKE_POLL_TIME_MINUTES,
            search_within: this.env.QUAKE_CACHE_TTL_DAYS,
        };

        this.quakes = [];
        this.cache = new Map();
        this.recentQuakes = new Set();
        this.ips = new Map();

        this.lastQueryTime = null;
        this.lastFullRefreshTime = null;

        this.maxClients = 0;
        this.maxUniqueConnections = 0;
        this.sessions = [];

        this.state.blockConcurrencyWhile(async () => {
            const lastQueryTimestamp = await this.state.storage.get('last-query-time');
            this.lastQueryTime = lastQueryTimestamp ? new Date(lastQueryTimestamp) : new Date();
            const lastFullRefreshTimestamp = await this.state.storage.get('last-full-refresh');
            this.lastQueryTime = lastFullRefreshTimestamp ? new Date(lastFullRefreshTimestamp) : new Date();

            const quakesJSON = await this.state.storage.get('quakes');
            if (!quakesJSON) return;
            console.log(`Retrieved ${quakesJSON.length} quakes from store.`);
            for (const quakeJSON of quakesJSON) {
                this.cacheQuake(Quake.fromJSON(quakeJSON));
            }
        });
    }

    get stats() {
        return {
            quakes: this.quakes.length,
            connected_clients: this.sessions.length,
            connected_clients_peak: this.maxClients,
            unique_connections: this.ips.size,
            unique_connections_peak: this.maxUniqueConnections,
        };
    }

    handleWebsocketUpgrade(request) {
        const {0: client, 1: server} = new WebSocketPair();
        server.accept();
        this.handleSession(request, server);
        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    handleSession(request, socket) {
        const session = {
            quit: false,
            lastMessageTime: Date.now(),
            ping() {
                this.emit('ping', Date.now());
            },
            emit(event, data) {
                this.send([event, data]);
            },
            send(data) {
                try {
                    if (this.quit) return;
                    if (typeof data !== 'string') data = JSON.stringify(data);
                    socket.send(data);
                    this.lastMessageTime = Date.now();
                } catch (err) {
                    console.error('failed to send message to socket');
                    console.error(err);
                    closeOrErrorHandler();
                }
            },
            close() {
                socket.close();
                closeOrErrorHandler();
            },
        };
        this.sessions.push(session);
        if (this.sessions.length > this.maxClients) {
            this.maxClients = this.sessions.length;
        }
        const ip = request.headers.get('CF-Connecting-IP');
        if (this.ips.has(ip)) {
            this.ips.set(ip, this.ips.get(ip) + 1);
        } else {
            this.ips.set(ip, 1);
        }
        if (this.ips.size > this.maxUniqueConnections) {
            this.maxUniqueConnections = this.ips.size;
        }
        this.emit('stats', this.stats);

        socket.addEventListener('message', message => {
            try {
                if (session.quit) {
                    socket.close(1011, 'WebSocket broken.');
                    return;
                }
                session.lastMessageTime = Date.now();
                const [event, data] = JSON.parse(message.data);
                switch (event) {
                    case 'ping':
                        const now = Date.now();
                        session.emit('pong', {then: data, now, diff: now - data});
                        return;
                    case 'sync':
                        session.emit('config', this.clientConfig);
                        session.emit('stats', this.stats);
                        session.emit('all_quakes', this.getAllQuakes());
                        return;
                }
            } catch (err) {
                console.error('error while handling socket message');
                console.error(err);
            }
        });
        const closeOrErrorHandler = () => {
            session.quit = true;
            this.sessions = this.sessions.filter(s => s !== session);

            const ipCount = this.ips.get(ip);
            if (ipCount <= 1) {
                this.ips.delete(ip);
            } else {
                this.ips.set(ip, ipCount - 1);
            }
            this.emit('stats', this.stats);
        };
        socket.addEventListener('close', closeOrErrorHandler);
        socket.addEventListener('error', closeOrErrorHandler);
    }

    async fetch(request) {
        const upgradeHeader = request.headers.get('Upgrade');
        if (upgradeHeader) {
            if (upgradeHeader !== 'websocket') {
                return new Response('Expected Upgrade: websocket.', {status: 426});
            }

            return this.handleWebsocketUpgrade(request);
        }

        const url = new URL(request.url);
        switch (url.pathname) {
            case '/session':
                return new Response('Expected Upgrade: websocket', {status: 426});
            case '/stats':
                return jsonResponse(this.stats);
            case '/quakes':
                return jsonResponse(this.getAllQuakes());
            case '/sync_quakes':
                return jsonResponse(await this.syncQuakes());
            case '/reset':
                this.cache.clear();
                this.quakes = [];
                await this.state.storage.delete('quakes');
                // const oldSessions = this.sessions;
                // this.sessions = [];
                // for (const session of oldSessions) {
                //     try {
                //         session.close();
                //     } catch (e) {
                //         console.error('Error while closing session', e.message);
                //     }
                // }
                return new Response('cache cleared', {status: 200});
        }

        return new Response('not found', {status: 404});
    }

    async syncQuakes() {
        let updatedQuakes;
        if (!this.lastQueryTime || !this.lastFullRefreshTime || this.env.FULL_REFRESH_INTERVAL_MINUTES * 60000 > Date.now() - this.lastFullRefreshTime) {
            updatedQuakes = await this.queryAllQuakes();
            this.lastFullRefreshTime = new Date();
            await this.state.storage.put('last-full-refresh', this.lastFullRefreshTime.getTime());
        } else {
            updatedQuakes = await this.checkForNewQuakes();
        }

        this.lastQueryTime = new Date();
        await this.state.storage.put('last-query-time', this.lastQueryTime.getTime());

        this.syncUpdatedQuakes(updatedQuakes);
        this.refreshRecentQuakes();
        const oldQuakeIds = this.expireOldEarthquakes();
        this.syncRemovedQuakes(oldQuakeIds);

        console.log(`Storing ${this.quakes.length} quakes...`);
        await this.state.storage.put('quakes', this.quakes.map(quake => quake.toJSON()));

        this.sessionHealthCheck();

        return {
            updatedQuakes,
            oldQuakeIds,
        };
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
        const quakes = await searchQuakes(fromDate, this.env.MIN_MAGNITUDE, this.env.MAX_DEPTH_KM);
        const updatedQuakes = [];
        for (const quake of quakes) {
            const cachedQuake = this.cache.get(quake.id);
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
        return this.quakes;
    }

    cacheQuake(quake) {
        this.cache.set(quake.id, quake);
        this.quakes.push(quake);
    }

    uncacheQuake(quakeToRemove) {
        this.cache.delete(quakeToRemove.id);
        this.quakes = this.quakes.filter(quake => quake.id != quakeToRemove.id);
    }

    uncacheQuakesById(oldQuakeIds) {
        for (const id in oldQuakeIds) {
            this.cache.delete(id);
        }
        this.quakes = this.quakes.filter(quake => !oldQuakeIds.includes(quake.id));
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
        for (const quake of this.quakes) {
            if (quake.time.getTime() < recentPeriod) {
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

        for (const quake of this.quakes) {
            if (quake.time < fromDate) {
                oldQuakeIds.push(quake.id);
            }
        }

        this.uncacheQuakesById(oldQuakeIds);

        if (oldQuakeIds.length) {
            console.log('Earthquakes have expired: ' + oldQuakeIds.join(', '));
        }

        return oldQuakeIds;
    }

    syncUpdatedQuakes(quakes) {
        if (!quakes.length) {
            return;
        }
        this.emit('new_quakes', quakes);
    }

    syncRemovedQuakes(ids) {
        if (!ids.length) {
            return;
        }
        this.emit('old_quakes', ids);
    }

    emit(event, data) {
        const message = JSON.stringify([event, data]);
        for (const session of this.sessions) {
            session.send(message);
        }
    }

    sessionHealthCheck() {
        const now = Date.now();
        for (const session of this.sessions) {
            if (now - session.lastMessageTime > sessionHealthCheckIntervalMs) {
                session.ping();
            }
        }
    }
}

function jsonResponse(data) {
    return new Response(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
            'content-type': 'application/json;charset=UTF-8',
        },
    });
}
