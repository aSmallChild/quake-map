<script>
    import { createMap } from '../lib/map.js';
    import { onMount } from 'svelte';
    import { addSocketListener, removeSocketListener, sendMessage } from '../lib/client-socket-handler.js';

    let quakeInfoContainer, mapContainer;

    onMount(() => {
        let quakeMap;
        let destroyed = false;
        const onOpen = event => {
            if (event === 'open') {
                sendMessage('sync');
            }
        };

        createMap(mapContainer, quakeInfoContainer).then(m => {
            if (destroyed) {
                m.destroy();
                return;
            }
            quakeMap = m;
            sendMessage('sync');
            addSocketListener(onOpen);
        });

        return () => {
            destroyed = true;
            if (quakeMap) {
                removeSocketListener(quakeMap.socketListener);
                quakeMap.destroy();
            }
            removeSocketListener(onOpen);
        };
    });
</script>

<div class="quake_info_container" bind:this={quakeInfoContainer}></div>
<div class="map" bind:this={mapContainer}></div>
