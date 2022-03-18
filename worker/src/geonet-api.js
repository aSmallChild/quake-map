import {Quake} from '../../ui/src/lib/quake.js';

const urlQuakeSearch = 'https://quakesearch.geonet.org.nz/geojson';
const urlQuakePage = 'https://www.geonet.org.nz/earthquake/';
const urlQuakeQuery = 'https://api.geonet.org.nz/quake/';

/**
 * @param {Date} fromDate
 * @param {number} minMagnitude
 * @param {number} maxDepth
 * @param {number[]} boxCoordinates
 * @returns {Promise<[]>}
 */
export async function searchQuakes(fromDate, minMagnitude = 0, maxDepth = 0, boxCoordinates = null) {
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
    let url = `${urlQuakeSearch}?&startdate=${fromDate.toISOString().split('.')[0]}`;
    if (minMagnitude) {
        url += `&minmag=${minMagnitude}`;
    }
    if (maxDepth) {
        url += `&maxdepth=${maxDepth}`;
    }
    if (boxCoordinates) {
        url += `&bbox=${boxCoordinates.join(',')}`;
    }
    console.log(`Fetching quakes: ${url}`);
    const quakes = [];
    try {
        const res = await fetch(url);
        if (res.status !== 200) {
            console.error('Geonet returned non 200 code: ' + res.status);
            return quakes;
        }
        const json = await res.json();
        for (const feature of json.features) {
            const quake = new Quake(feature.properties.publicid);
            quake.url = urlQuakePage + quake.id;
            parseCommonFeatureFields(quake, feature);
            quake.time = feature.properties.origintime;
            quake.modified = feature.properties.modificationtime;
            quakes.push(quake);
        }
    } catch (error) {
        console.error('Failed to contact geonet. ', error);
    }
    return quakes;
}

export async function getQuake(id, quake = null) {
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

    const url = urlQuakeQuery + id;
    const msg = `Fetching quake: ${url}... `;
    try {
        const res = await fetch(url);
        if (res.status !== 200) {
            console.error(`${msg} Responded with HTTP ${res.status}`);
            return null;
        }
        const json = await res.json();
        const [feature] = json.features;
        quake = quake ?? new Quake(id);
        quake.url = urlQuakePage + id;
        parseCommonFeatureFields(quake, feature);
        quake.time = feature.properties.time;
        quake.quality = feature.properties.quality;
        console.log(msg);
        return quake;
    } catch (error) {
        console.error(`${msg} ${error}`);
    }
    console.warn(`${msg} No quake found`);
    return null;
}

function parseCommonFeatureFields(quake, feature) {
    [quake.long, quake.lat] = feature.geometry.coordinates;
    quake.mag = feature.properties.magnitude;
    quake.depth = feature.properties.depth;
}
