import {searchQuakes} from './geonet-api.js';

export default async function getLatestQuakes(event, env) {
    searchQuakes(fromDate, minMagnitude = 0, maxDepth = 0, boxCoordinates = null)
    // query latest quakes
    // publish to durable object

    // poll geonet
    // quakeService.queryAllQuakes();
    // setInterval(() => quakeService.queryAllQuakes(), config.full_refresh_interval_minutes * 60000);
    // setInterval(() => {
    //     quakeService.expireOldEarthquakes();
    //     quakeService.checkForNewQuakes();
    // }, config.geonet_polling_interval_seconds * 1000);
}