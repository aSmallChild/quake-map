<script>
    import {shrinkIn} from '../lib/util.js';

    let { stats } = $props();
    let element = $state();

    $effect(() => {
        if (stats && element) {
            shrinkIn(element);
        }
    });

    let clients = $derived(!stats || stats.connected_clients == 1 ? 'client' : 'clients');
    let viewers = $derived(!stats || stats.unique_connections == 1 ? 'viewer' : 'viewers');
</script>

{#if stats}
<div class="stats" bind:this={element}>
    {stats.connected_clients} {clients} {stats.unique_connections} {viewers}
</div>
{/if}