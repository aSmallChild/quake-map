import Util from "./util.js";
import QuakeMap from "./quake-map.js";
import GoogleQuakeMarker from "./google-quake-marker.js";

window.initMap = async function () {
    const map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: -41.5,
            lng: 174
        },
        zoom: 6,
        disableDefaultUI: true
    });
    await ioReady;
    /** @param window.io */
    window.quakeMap = new QuakeMap(map, window.io(), document.getElementById('quake_info_container'), document.getElementById('stats_container'), GoogleQuakeMarker);
}
const apiKey = document.getElementById('google_maps_key').value;
Util.loadScript(`//maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`);
const ioReady = Util.loadScript('/socket.io/socket.io.js');