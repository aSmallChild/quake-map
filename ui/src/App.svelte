<script>
    import Disclaimer from './components/Disclaimer.svelte';
    import Stats from './components/Stats.svelte';
    import createGoogleMap from './lib/map-google.js';
    import createLeafletMap from './lib/map-leaflet.js';
    import {onQuakeMap, mapStyleBuilder} from './lib/map-style-pipboy.js';

    let stats = {unique_connections: 0, connected_clients: 0}, quakeInfoContainer;

    async function createMap(mapContainer) {
        const mapTheme = 'default'; // todo decide based on route
        const styleBuilder = mapTheme == 'pipboy' ? mapStyleBuilder : null;
        const onMapCreated = mapTheme == 'pipboy' ? onQuakeMap : null;
        document.body.classList.add(mapTheme);
        const mapCreated = quakeMap => {
            quakeMap.setQuakeInfoContainer(quakeInfoContainer);
            if (onMapCreated) {
                onMapCreated(quakeMap);
            }
            // todo handle socket events
            // socket.on('message', ([event, data]) => {
            //     if (event === 'stats') {
            //         stats = data;
            //         return;
            //     }
            //     quakeMap.on(event, data);
            // });
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

<Stats stats={stats}/>
<div class="quake_info_container" bind:this={quakeInfoContainer}></div>
<div class="map" use:createMap></div>
<Disclaimer/>

<style lang="scss" global>
  @import "css/base.css";
  @import "css/pipboy.scss";
</style>
