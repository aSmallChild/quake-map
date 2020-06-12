import fetch from 'node-fetch';
import Quake from '../web/js/quake.js';

export default class Geonet {
    constructor(logger) {
        this.logger = logger || console;
        this.urlQuakeSearch = 'https://quakesearch.geonet.org.nz/geojson';
        this.urlQuakePage = 'https://www.geonet.org.nz/earthquake/';
        this.urlQuakeQuery = 'https://api.geonet.org.nz/quake/';
    }

    /**
     * @param {Date} fromDate
     * @param {number} minMagnitude
     * @param {number} maxDepth
     * @param {number[]} boxCoordinates
     * @returns {Promise<[]>}
     */
    async searchQuakes(fromDate, minMagnitude= 0, maxDepth= 0, boxCoordinates= null) {
        // {
        //     "type": "FeatureCollection",
        //     "features": [{
        //         "type": "Feature",
        //         "geometry": {"type": "Point", "coordinates": [173.7379913, -42.24602127]},
        //         "properties": {
        //             "publicid": "2016p862895",
        //             "eventtype": "earthquake",
        //             "origintime": "2016-11-15T06:30:33.216Z",
        //             "modificationtime": "2016-11-15T06:41:10.068Z",
        //             "depth": 7.478375912,
        //             "magnitude": 5.779644657,
        //             "magnitudetype": "M",
        //             "evaluationmethod": "LOCSAT",
        //             "evaluationstatus": "confirmed",
        //             "evaluationmode": "manual",
        //             "earthmodel": "iasp91",
        //             "usedphasecount": 10,
        //             "usedstationcount": 6,
        //             "minimumdistance": 0.2250061333,
        //             "azimuthalgap": 179.8320503,
        //             "originerror": 0.4994083478,
        //             "magnitudestationcount": 157
        //         }
        //     }]
        // }
        let url = `${this.urlQuakeSearch}?&startdate=${fromDate.toISOString().split('.')[0]}`;
        if (minMagnitude) {
            url += `&minmag=${minMagnitude}`;
        }
        if (maxDepth) {
            url += `&maxdepth=${maxDepth}`;
        }
        if (boxCoordinates) {
            url += `&bbox=${boxCoordinates.join(',')}`;
        }
        this.logger.log(`Fetching quakes: ${url}`);
        const quakes = [];
        try {
            const res = await fetch(url);
            if (res.status !== 200) {
                this.logger.error('Failed to contact geonet. ' + res.status);
                return quakes;
            }
            const json = await res.json();
            for (const feature of json.features) {
                /** @param feature.publicid */
                /** @param feature.origintime */
                /** @param feature.modificationtime */
                const quake = new Quake(feature.properties.publicid);
                quake.url = this.urlQuakePage + quake.id;
                this.parseCommonFeatureFields(quake, feature);
                quake.time = feature.properties.origintime;
                quake.modified = feature.properties.modificationtime;
                quakes.push(quake);
            }
        } catch (error) {
            this.logger.error('Failed to contact geonet. ' + error);
        }
        return quakes;
    }

    async queryQuake(quake) {
        // https://api.geonet.org.nz/quake/2016p862895
        // {
        //     "type": "FeatureCollection",
        //     "features": [{
        //         "type": "Feature",
        //         "geometry": {"type": "Point", "coordinates": [172.9809723, -43.35796329]},
        //         "properties": {
        //             "publicID": "2013p407387",
        //             "time": "2013-05-31T17:36:02.215Z",
        //             "depth": 31.60156250000000000,
        //             "magnitude": 3.76547311499999982,
        //             "locality": "25 km south-east of Amberley",
        //             "mmi": 3,
        //             "quality": "best"
        //         }
        //     }]
        // }

        const url = this.urlQuakeQuery + quake.id;
        let msg = `Fetching quake: ${url}... `;
        try {
            const res = await fetch(url);
            if (res.status !== 200) {
                this.logger.error(`${msg} Responded with HTTP ${res.status}`);
                return null;
            }
            const json = await res.json();
            const [feature] = json.features;
            const earthquake = new Quake(quake.id);
            earthquake.url = quake.url;
            this.parseCommonFeatureFields(earthquake, feature);
            earthquake.time = feature.properties.time;
            earthquake.quality = feature.properties.quality;
            this.logger.log(msg);
            return earthquake;
        } catch (error) {
            this.logger.error(`${msg} ${error}`);
        }
        this.logger.warn(`${msg} No quake found`);
        return null;
    }

    parseCommonFeatureFields(quake, feature) {
        /** @param feature.geometry.coordinates */
        /** @param feature.magnitude */
        [quake.long, quake.lat] = feature.geometry.coordinates;
        quake.mag = feature.properties.magnitude;
        quake.depth = feature.properties.depth;
    }
}
