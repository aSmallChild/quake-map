const EventEmitter = require('events');

module.exports = class {
    constructor(geonet, config, logger) {
        this.config = config;
        this.geonet = geonet;
        this.cache = {};
        this.recentQuakes = {};
        this.lastQueryTime = new Date();
        this.logger = logger || console;
        this.events = new EventEmitter();
    }

    getAllQuakes() {
        return this.cache;
    }

    queryAllQuakes() {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - this.config.quake_cache_ttl_days);
        this.queryQuakes(fromDate);
    }

    checkForNewQuakes() {
        const fromDate = new Date(this.lastQueryTime.getTime() - this.config.quake_search_time_minutes * 60000);
        this.queryQuakes(fromDate);
    }

    async queryQuakes(fromDate) {
        this.lastQueryTime = new Date();
        const quakes = await this.geonet.searchQuakes(fromDate, this.config.min_magnitude, this.config.max_depth_km);
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
            this.stopPollingQuake(quake);
            return;
        }

        this.logger.log(`Refreshing quake data for ${quake.id}`);
        const earthquake = await this.geonet.queryQuake(quake);
        if (!earthquake) {
            return;
        }

        if (earthquake.quality == 'deleted') {
            this.logger.log(`Earthquake was deleted ${quake.id}`);
            this.uncacheQuake(quake);
            this.stopPollingQuake(quake);
            this.syncRemovedQuakes([quake.id]);
            return;
        } else if (!quake.equals(earthquake)) {
            quake.update(earthquake);
            this.syncUpdatedQuakes([quake]);
        }

        if (quake.quality == 'best') {
            this.stopPollingQuake(quake);
        }
    }

    cacheQuake(quake) {
        this.cache[quake.id] = quake;
    }

    uncacheQuake(quake) {
        delete this.cache[quake.id];
    }

    stopPollingQuake(quake) {
        if (this.recentQuakes.hasOwnProperty(quake.id)) {
            delete this.recentQuakes[quake.id];
            this.logger.log("Stopped polling quake " + quake.id);
            return true;
        }
        return false;
    }

    refreshRecentQuakes() {
        const recentPeriod = Date.now() - this.config.recent_quake_poll_time_minutes * 60000;
        const quakesToSync = [];
        for (const id in this.cache) {
            const quake = this.cache[id];
            if (Date.parse(quake.time) < recentPeriod) {
                if (this.stopPollingQuake(quake)) {
                    quakesToSync.push(quake);
                }
            } else if (quake.quality !== 'best' && quake.quality !== 'deleted') {
                // only poll quakes that have not been reviewed
                // best/deleted means quake has been reviewed
                // quality property is set after querying the quake individually with refreshQuake()
                this.recentQuakes[quake.id] = quake;
            }
        }
        this.syncUpdatedQuakes(quakesToSync);

        for (const id in this.recentQuakes) {
            this.refreshQuake(this.recentQuakes[id]);
        }
    }

    expireOldEarthquakes() {
        const oldQuakeIds = [];

        let fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - this.config.quake_cache_ttl_days);
        fromDate = fromDate.toISOString();

        for (const id in this.cache) {
            const quake = this.cache[id];
            if (quake.time < fromDate) {
                oldQuakeIds.push(id);
                this.uncacheQuake(quake);
            }
        }

        if (oldQuakeIds.length) {
            this.logger.log('Earthquakes have expired: ' + oldQuakeIds.join(', '));
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
