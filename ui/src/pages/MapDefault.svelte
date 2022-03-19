<script>
    import {createMap} from '../lib/map.js';
    import {onMount} from 'svelte';
    import {addSocketListener, sendMessage} from '../lib/client-socket-handler.js';

    let quakeInfoContainer, mapContainer;

    onMount(async () => {
        await createMap(mapContainer, quakeInfoContainer);
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
