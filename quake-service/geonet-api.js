import { Quake } from '@quake/shared';

const urlQuakeSearch = 'https://quakesearch.geonet.org.nz/geojson';
const urlQuakePage = 'https://www.geonet.org.nz/earthquake/';
const urlQuakeQuery = 'https://api.geonet.org.nz/quake/';

/**
 * @param {Date} fromDate
 * @param {number} minMagnitude
 * @param {number} maxDepth
 * @param {number[]} boxCoordinates
 * @returns {Promise<Quake[]>}
 */
export async function searchQuakes(fromDate, minMagnitude = 0, maxDepth = 0, boxCoordinates = null) {
    let url = `${urlQuakeSearch}?startdate=${fromDate.toISOString()}`;
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

/**
 * @param {string} id
 * @param {Quake|null} quake
 * @returns {Promise<Quake|null>}
 */
export async function getQuake(id, quake = null) {
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
