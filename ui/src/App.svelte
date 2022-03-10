<script>
    import {Router, Route} from 'svelte-navigator';
    import Disclaimer from './components/Disclaimer.svelte';
    import Stats from './components/Stats.svelte';
    import MapPipboy from './pages/MapPipboy.svelte';
    import MapDefault from './pages/MapDefault.svelte';
    import {registerSocketListener} from './lib/client-socket-handler.js';

    let stats = {unique_connections: 0, connected_clients: 0};

    registerSocketListener((event, data) => {
        if (event === 'stats') {
            stats = data;
        }
    });

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
