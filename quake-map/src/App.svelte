<script>
    import { Route, Router } from 'svelte-routing';
    import Disclaimer from './components/Disclaimer.svelte';
    import Stats from './components/Stats.svelte';
    import MapPipboy from './pages/MapPipboy.svelte';
    import MapDefault from './pages/MapDefault.svelte';
    import { addSocketListener, connectSocket } from './lib/client-socket-handler.js';

    let stats = $state({ unique_connections: 0, connected_clients: 0 });

    addSocketListener((event, data) => {
        if (event === 'stats') {
            stats = data;
        }
    });

    connectSocket();

    // import {handleMessage, connectSocket} from './lib/client-socket-handler.js';
    // document.addEventListener('keypress', e => {
    //     switch (e.key) {
    //         case '2':
    //             return console.log(import.meta.env.VITE_API_HOST);
    //         case 'c':
    //             return connectSocket();
    //         case 'a':
    //             return handleMessage(['stats', {unique_connections: Math.random() * 20 >> 0, connected_clients: Math.random() * 20 >> 0, 'peak_connected_clients': 2, 'peak_unique_connections': 2}]);
    //         case 'f':
    //             return handleMessage(['config', {'min_magnitude': 3, 'max_depth_km': 300, 'highlight_quakes_within': 30, 'search_within': 1}]);
    //         case 'd':
    //             return handleMessage(['old_quakes', ['2022p182715', '2022p183540']]);
    //         case 's':
    //             return handleMessage([
    //                 'all_quakes', [
    //                     {'id': '2022p181390', 'url': 'https://www.geonet.org.nz/earthquake/2022p181390', 'long': 177.3231964, 'lat': -37.73579025, 'mag': Math.random() * 10, 'depth': 55.51134872, 'time': (new Date()).toISOString(), 'modified': '2022-03-09T02:50:51.007Z'},
    //                     {'id': '2022p182544', 'url': 'https://www.geonet.org.nz/earthquake/2022p182544', 'long': -178.8741455, 'lat': -34.79519653, 'mag': 3.488113771, 'depth': 100, 'time': '2022-03-09T12:59:00.431Z', 'modified': '2022-03-09T13:15:16.097Z'},
    //                     {'id': '2022p182747', 'url': 'https://www.geonet.org.nz/earthquake/2022p182747', 'long': -178.6510925, 'lat': -34.9515419, 'mag': 3.735543821, 'depth': 100, 'time': '2022-03-09T14:47:10.890Z', 'modified': '2022-03-09T14:52:46.973Z'},
    //                     // {'id': '2022p182715', 'url': 'https://www.geonet.org.nz/earthquake/2022p182715', 'long': -178.7107391, 'lat': -34.92905426, 'mag': 4.128819377, 'depth': 33, 'time': '2022-03-09T14:30:10.003Z', 'modified': '2022-03-09T14:35:36.664Z'},
    //                     // {'id': '2022p182938', 'url': 'https://www.geonet.org.nz/earthquake/2022p182938', 'long': -179.5278778, 'lat': -30.10330009, 'mag': 4.280929112, 'depth': 286.3326111, 'time': '2022-03-09T16:28:12.848Z', 'modified': '2022-03-09T16:35:01.884Z'},
    //                     // {'id': '2022p183093', 'url': 'https://www.geonet.org.nz/earthquake/2022p183093', 'long': -178.5991364, 'lat': -33.39495468, 'mag': 4.444478733, 'depth': 100, 'time': '2022-03-09T17:51:17.735Z', 'modified': '2022-03-09T18:02:26.232Z'},
    //                     // {'id': '2022p183437', 'url': 'https://www.geonet.org.nz/earthquake/2022p183437', 'long': 177.8936768, 'lat': -37.66932678, 'mag': 3.242034546, 'depth': 62.38550949, 'time': '2022-03-09T20:55:24.562Z', 'modified': '2022-03-09T20:57:32.506Z'},
    //                     // {'id': '2022p183540', 'url': 'https://www.geonet.org.nz/earthquake/2022p183540', 'long': 178.3211212, 'lat': -29.89887619, 'mag': 4.372490918, 'depth': 33, 'time': '2022-03-09T21:48:47.637Z', 'quality': 'preliminary'},
    //                     // {'id': '2022p183756', 'url': 'https://www.geonet.org.nz/earthquake/2022p183756', 'long': -176.010437, 'lat': -28.89496613, 'mag': 4.289461834, 'depth': 229.1062469, 'time': '2022-03-09T23:43:12.734Z', 'quality': 'preliminary'},
    //                 ]]);
    //     }
    // });
</script>

<Router>
    <Stats {stats}/>
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
