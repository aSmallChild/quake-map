<script>
    import {onMount} from 'svelte';
    import {shrinkIn, shrinkOut} from '../lib/util.js';

    let disclaimer;

    onMount(() => {
        setTimeout(() => {
            shrinkIn(disclaimer);
            setTimeout(() => shrinkOut(disclaimer), 4500);
        }, 500);
    });
</script>

<div class="disclaimer" bind:this={disclaimer} style="display: none;">
    <a href="//github.com/aSmallChild/quake-map">View on github</a>.
    Data is provided by
    <a href="//geonet.org.nz">Geonet</a> &amp;
    <a href="//gns.cri.nz">GNS Science</a> under the Creative Commons license
</div>

