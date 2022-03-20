<script>
    import {Router, Route} from 'svelte-navigator';
    import Disclaimer from './components/Disclaimer.svelte';
    import Stats from './components/Stats.svelte';
    import MapPipboy from './pages/MapPipboy.svelte';
    import MapDefault from './pages/MapDefault.svelte';
    import {addSocketListener, connectSocket} from './lib/client-socket-handler.js';
    import {onMount} from 'svelte';

    let stats = {unique_connections: 0, connected_clients: 0};

    addSocketListener((event, data) => {
        if (event === 'stats') {
            stats = data;
        }
    });

    onMount(() => {
        if (import.meta.env.VITE_CLOUDFLARE_ANALYTICS_KEY) {
            const script = document.createElement('script');
            script.src = '//static.cloudflareinsights.com/beacon.min.js';
            script.dataset.CfBeacon = `{"token": "${import.meta.env.VITE_CLOUDFLARE_ANALYTICS_KEY}"}`;
            document.head.appendChild(script);
        }
    });

    connectSocket();

</script>

<Router>
    <Stats stats={stats}/>
    <Route path="/">
        <MapDefault/>
    </Route>
    <Route path="/pipboy">
        <MapPipboy/>
    </Route>
    <Disclaimer/>
</Router>

<style lang="scss" global>
  @import "css/base.css";
</style>
