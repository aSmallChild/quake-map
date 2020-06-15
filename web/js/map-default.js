import QuakeMap from "./quake-map.js";
import GoogleQuakeMarker from "./google-quake-marker.js";

window.initMap = function () {
    const map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: -41.5,
            lng: 174
        },
        zoom: 6,
        disableDefaultUI: true
    });

    window.quakeMap = new QuakeMap(map, io(), document.getElementById('quake_info_container'), document.getElementById('stats_container'), GoogleQuakeMarker);
}