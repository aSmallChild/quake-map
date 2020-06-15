import Util from "./util.js";
import QuakeMap from "./quake-map.js";

class LeafletQuakeMarker {
    constructor(map, config, colour) {
        this.map = map;
        this.config = config;
        this._selected = false;
        this.colour = colour;
        this._marker = null;
    }

    update(quake) {
        const position = [quake.lat, quake.long];
        if (this._marker) {
            this._marker.setLatLng(position);
            const style = this.buildStyle(quake)
            this._marker.setStyle(style);
            this._marker.setRadius(style.radius);
        } else {
            this._marker = L.circle(position, this.buildStyle(quake));
            this._marker.addTo(this.map);
        }
        this._marker.off();
    }

    buildStyle(quake) {
        // make recent quakes more opaque
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - this.config.search_within);
        let opacity = (quake.time.getTime() - fromDate.getTime()) / (Date.now() - fromDate.getTime());
        opacity = Math.pow(opacity + 1, 5) / 32;

        return {
            fillColor: this.getQuakeFillColour(quake),
            fillOpacity: opacity,
            radius: (7 + Math.pow(quake.mag, 2)) * 1000,
            color: this.colour,
            weight: this.getStrokeWeight()
        };
    }

    getStrokeWeight() {
        return this.selected ? 4 : 2;
    }

    getQuakeFillColour(quake) {
        // green to red, red for higher magnitudes
        let mag = quake.mag;
        const minMag = 3;
        let maxMag = 6;
        maxMag -= minMag;
        mag -= minMag;
        mag = mag < 0 ? 0 : mag;

        let green = Math.abs(parseInt((1 - mag / maxMag) * 255));
        green = (green > 255 ? 255 : green).toString(16);
        if (green.length == 1) {
            green = '0' + green;
        }
        let red = parseInt(mag / maxMag * 255);
        red = (red > 255 ? 255 : red).toString(16);
        if (red.length == 1) {
            red = '0' + red;
        }

        return '#' + red + green + '00';
    }

    set selected(isSelected) {
        this._selected = isSelected;
        if (this._marker) {
            this._marker.setStyle({weight: this.getStrokeWeight()});
        }
    }

    get selected() {
        return this._selected;
    }

    get marker() {
        return this._marker;
    }

    set visible(visible) {
        if (visible) this._marker.addTo(this.map);
        else this._marker.remove();
    }

    adjustMapZoomAndPosition(map, avgLat, avgLong, latRange, longRange) {
        map.panTo([avgLat, avgLong]);
        if (latRange < 1.75 && longRange < 1.75) {
            map.setZoom(9);
        } else if (latRange < 4 && longRange < 4) {
            map.setZoom(8);
        } else if (latRange < 8 && longRange < 8) {
            map.setZoom(7);
        } else {
            map.setZoom(6);
        }
    }

    ensureMarkerIsInView(map) {
        if (!map.getBounds().contains(this._marker.getLatLng())) {
            map.panTo(this._marker.getLatLng());
        }
    }

    centerMapOnMarker(map) {
        map.panTo(this._marker.getLatLng())
    }

    addEventListener(event, listener) {
        this._marker.on(event, listener);
    }
}

const cssReady = Util.loadStyle('//unpkg.com/leaflet@1.6.0/dist/leaflet.css');
const mapReady = Util.loadScript('//unpkg.com/leaflet@1.6.0/dist/leaflet.js');
const ioReady = Util.loadScript('/socket.io/socket.io.js');

(async () => {
    /** @param window.io */
    /** @param window.L */
    const accessToken = document.getElementById('mapbox_access_token').value;
    await cssReady;
    await mapReady;
    const map = L.map('map', {zoomControl: false}).setView([-41.5, 174], 6);

    L.tileLayer('https://api.mapbox.com/styles/v1/{style}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        style: window.hasOwnProperty('mapStyleBuilder') ? window.mapStyleBuilder('leaflet') : 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: accessToken
    }).addTo(map);

    await ioReady;
    window.quakeMap = new QuakeMap(map, window.io(), document.getElementById('quake_info_container'), document.getElementById('stats_container'), LeafletQuakeMarker);
    if (window.hasOwnProperty('onQuakeMap')) {
        window.onQuakeMap(window.quakeMap);
    }
})();