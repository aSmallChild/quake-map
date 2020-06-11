let quakeMap;
// noinspection JSUnusedGlobalSymbols
function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: -41.5,
            lng: 174
        },
        zoom: 6,
        disableDefaultUI: true
    });

    quakeMap = new QuakeMap(map, io(), document.getElementById('quake_info_container'), document.getElementById('stats_container'));
}