import Util from "./util.js";
import QuakeMap from "./quake-map.js";
import GoogleQuakeMarker from "./google-quake-marker.js";

window.initMap = async function () {
    const styledMapType = new google.maps.StyledMapType([{
        "featureType": "administrative",
        "stylers": [{"color": "#35ff3a"}, {"saturation": 100}, {"lightness": -15}, {"visibility": "simplified"}]
    }, {
        "featureType": "landscape",
        "elementType": "geometry.fill",
        "stylers": [{"color": "#004400"}]
    }, {
        "featureType": "landscape",
        "elementType": "labels.text",
        "stylers": [{"color": "#00ff00"}, {"visibility": "simplified"}]
    }, {
        "featureType": "landscape.man_made",
        "elementType": "geometry.stroke",
        "stylers": [{"color": "#00cc00"}]
    }, {
        "featureType": "landscape.natural",
        "elementType": "labels.icon",
        "stylers": [{"visibility": "off"}]
    }, {
        "featureType": "landscape.natural.landcover",
        "stylers": [{"visibility": "off"}]
    }, {
        "featureType": "landscape.natural.terrain",
        "stylers": [{"visibility": "off"}]
    }, {
        "featureType": "poi",
        "stylers": [{"color": "#008200"}, {"visibility": "simplified"}]
    }, {
        "featureType": "poi",
        "elementType": "geometry.fill",
        "stylers": [{"color": "#005300"}]
    }, {
        "featureType": "poi",
        "elementType": "geometry.stroke",
        "stylers": [{"color": "#008200"}, {"visibility": "simplified"}]
    }, {
        "featureType": "poi",
        "elementType": "labels",
        "stylers": [{"color": "#00cc00"}, {"visibility": "simplified"}]
    }, {
        "featureType": "poi",
        "elementType": "labels.icon",
        "stylers": [{"visibility": "off"}]
    }, {
        "featureType": "road",
        "stylers": [{"color": "#008603"}, {"visibility": "on"}]
    }, {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [{"visibility": "off"}]
    }, {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#24ff24"}, {"lightness": 100}]
    }, {
        "featureType": "transit",
        "elementType": "geometry.fill",
        "stylers": [{"color": "#006402"}]
    }, {
        "featureType": "transit",
        "elementType": "labels",
        "stylers": [{"color": "#24ff24"}, {"visibility": "off"}]
    }, {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [{"color": "#002000"}]
    }, {
        "featureType": "water",
        "elementType": "labels.text",
        "stylers": [{"color": "#24ff24"}]
    }], {name: 'Styled Map'});
    const map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: -41.5,
            lng: 174
        },
        zoom: 6,
        disableDefaultUI: true
    });
    map.mapTypes.set('styled_map', styledMapType);
    map.setMapTypeId('styled_map');
    await ioReady;
    /** @param window.io */
    window.quakeMap = new QuakeMap(map, window.io(), document.getElementById('quake_info_container'), document.getElementById('stats_container'), GoogleQuakeMarker);
    window.quakeMap.colours.list = ['#F90', '#F0F', '#06F', '#F9F', '#F60', '#60F', '#960', '#FF0', '#090', '#00F', '#AEF', '#C30', '#009', '#66F', '#93F', '#F00', '#606'];
    window.quakeMap.colours.ring_recent = '#0F0';
    window.quakeMap.colours.ring_old = '#AFA';
}
const apiKey = document.getElementById('google_maps_key').value;
Util.loadScript(`//maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`);
const ioReady = Util.loadScript('/socket.io/socket.io.js');