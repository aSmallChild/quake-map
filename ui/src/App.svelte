<script>
    import Disclaimer from './components/Disclaimer.svelte';
    import createGoogleMap from './lib/map-google.js';
    import createLeafletMap from './lib/map-leaflet.js';
    import {onQuakeMap, mapStyleBuilder} from './lib/map-style-pipboy.js';

    async function createMap(mapContainer) {
        const mapTheme = 'default'; // todo decide based on route
        const styleBuilder = mapTheme == 'pipboy' ? mapStyleBuilder : null;
        const onMapCreated = mapTheme == 'pipboy' ? onQuakeMap : null;
        document.body.classList.add(mapTheme);
        const mapCreated = quakeMap => {
            if (onMapCreated) {
                onMapCreated(quakeMap);
            }
            // todo handle socket events
            // socket.on('message', ([event, data]) => {
            //     quakeMap.on(event, data);
            // })
        };
        if (import.meta.env.VITE_GOOGLE_MAP_KEY) {
            return mapCreated(await createGoogleMap(mapContainer, import.meta.env.VITE_GOOGLE_MAP_KEY, styleBuilder));
        }
        if (import.meta.env.VITE_LEAFLET_ACCESS_TOKEN) {
            return mapCreated(await createLeafletMap(mapContainer, import.meta.env.VITE_LEAFLET_ACCESS_TOKEN, styleBuilder));
        }
        console.error('No public map API key configured.');
    }
</script>

<div id="stats_container"></div>
<div id="quake_info_container"></div>
<div class="map" use:createMap></div>
<Disclaimer/>

<style lang="scss" global>
  @import "css/base.css";
  @import "css/pipboy.scss";
</style>
