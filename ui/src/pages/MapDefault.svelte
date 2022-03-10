<script>
    import {createMap} from '../lib/map.js';
    import {onMount} from 'svelte';

    let quakeInfoContainer, mapContainer;

    onMount(() => createMap(mapContainer, quakeInfoContainer));
</script>

<div class="quake_info_container" bind:this={quakeInfoContainer}></div>
<div class="map" bind:this={mapContainer}></div>
