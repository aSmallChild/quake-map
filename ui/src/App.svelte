<script>
    import Disclaimer from './components/Disclaimer.svelte';
    import createGoogleMap from './lib/map-google.js';
    import createLeafletMap from './lib/map-leaflet.js';
    import {onQuakeMap, mapStyleBuilder} from './lib/map-style-pipboy.js';

    async function createMap(mapContainer) {
        const mapType = 'leaflet'; // todo env var
        const mapTheme = 'pipboy'; // todo decide based on route
        const styleBuilder = mapTheme == 'pipboy' ? mapStyleBuilder : null;
        const onMapCreated = mapTheme == 'pipboy' ? onQuakeMap : null;
        const mapCreated = quakeMap => {
            if (onMapCreated) {
                onMapCreated(quakeMap);
            }
            // todo handle socket events
            // socket.on('message', ([event, data]) => {
            //     quakeMap.on(event, data);
            // })
        };

        if (mapType == 'google') {
            const apiKey = '';// todo env var;
            mapCreated(await createGoogleMap(mapContainer, apiKey, styleBuilder));
        } else if (mapType == 'leaflet') {
            const accessToken = '';// todo env var;
            mapCreated(await createLeafletMap(mapContainer, accessToken, styleBuilder));
        } else {
            // todo handle error
        }
    }
</script>

<main>
    <div id="stats_container"></div>
    <div id="quake_info_container"></div>
    <div class="map" use:createMap></div>
    <Disclaimer/>
</main>

<style lang="scss">
  @import "css/base.css";
</style>
