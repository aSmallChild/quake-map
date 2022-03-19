<script>
    import {createMap} from '../lib/map.js';
    import {onQuakeMap, mapStyleBuilder} from '../lib/map-style-pipboy.js';
    import {onMount} from 'svelte';
    import {addSocketListener, sendMessage} from '../lib/client-socket-handler.js';

    let quakeInfoContainer, mapContainer;

    onMount(async () => {
        document.body.classList.add('pipboy');
        await createMap(mapContainer, quakeInfoContainer, mapStyleBuilder, onQuakeMap);
        sendMessage('ready', null);
        addSocketListener(event => {
            if (event == 'open') {
                sendMessage('ready');
            }
        })
    });
</script>

<div class="quake_info_container" bind:this={quakeInfoContainer}></div>
<div class="map" bind:this={mapContainer}></div>

<style lang="scss" global>
  @import "../css/pipboy.scss";
</style>

