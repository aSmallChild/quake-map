<script>
    import {createMap} from '../lib/map.js';
    import {onQuakeMap, mapStyleBuilder} from '../lib/map-style-pipboy.js';
    import {addSocketListener, sendMessage} from '../lib/client-socket-handler.js';

    let quakeInfoContainer = $state();
    let mapContainer = $state();

    $effect(() => {
        document.body.classList.add('pipboy');
        createMap(mapContainer, quakeInfoContainer, mapStyleBuilder, onQuakeMap).then(() => {
            sendMessage('sync');
        });

        addSocketListener(event => {
            if (event == 'open') {
                sendMessage('sync');
            }
        });

        return () => {
            document.body.classList.remove('pipboy');
        };
    });
</script>

<div class="quake_info_container" bind:this={quakeInfoContainer}></div>
<div class="map" bind:this={mapContainer}></div>

<style lang="scss" global>
  @import "../css/pipboy.scss";
</style>
