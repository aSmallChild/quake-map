<script>
    import {createMap} from '../lib/map.js';
    import {onQuakeMap, mapStyleBuilder} from '../lib/map-style-pipboy.js';
    import {onMount} from 'svelte';

    let quakeInfoContainer, mapContainer;

    onMount(() => {
        document.body.classList.add('pipboy');
        createMap(mapContainer, quakeInfoContainer, mapStyleBuilder, onQuakeMap);
    });
</script>

<div class="quake_info_container" bind:this={quakeInfoContainer}></div>
<div class="map" bind:this={mapContainer}></div>

<style lang="scss" global>
  @import "../css/pipboy.scss";
</style>

