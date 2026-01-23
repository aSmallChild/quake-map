<script>
    import { createMap } from '../lib/map.js';
    import { mapStyleBuilder, onQuakeMap } from '../lib/map-style-pipboy.js';
    import { addSocketListener, removeSocketListener, sendMessage } from '../lib/client-socket-handler.js';

    let quakeInfoContainer = $state();
    let mapContainer = $state();

    $effect(() => {
        let quakeMap;
        let destroyed = false;
        const onOpen = event => {
            if (event === 'open') {
                sendMessage('sync');
            }
        };

        document.body.classList.add('pipboy');
        createMap(mapContainer, quakeInfoContainer, mapStyleBuilder, onQuakeMap).then(m => {
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
            document.body.classList.remove('pipboy');
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

<style lang="scss" global>
    @import "../css/pipboy.scss";
</style>
