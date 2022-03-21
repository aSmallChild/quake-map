<script>
    import {createMap} from '../lib/map.js';
    import {onMount} from 'svelte';
    import {addSocketListener, sendMessage} from '../lib/client-socket-handler.js';

    let quakeInfoContainer, mapContainer;

    onMount(async () => {
        await createMap(mapContainer, quakeInfoContainer);
        sendMessage('sync');
        addSocketListener(event => {
            if (event == 'open') {
                sendMessage('sync');
            }
        })
    });
</script>

<div class="quake_info_container" bind:this={quakeInfoContainer}></div>
<div class="map" bind:this={mapContainer}></div>
