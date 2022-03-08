<script>
    import {shrinkIn} from '../lib/util.js';

    export let stats;
    let element;

    $: stats && element && shrinkIn(element);
    $: clients = !stats || stats.connected_clients == 1 ? 'client' : 'clients';
    $: viewers = !stats || stats.unique_connections == 1 ? 'viewer' : 'viewers';
</script>

{#if stats}
<div class="stats" bind:this={element}>
    {stats.connected_clients} {clients} {stats.unique_connections} {viewers}
</div>
{/if}
