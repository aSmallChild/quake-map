import {loadStyle, loadScript} from "./util.js";
import QuakeMap from "./quake-map.js";

class LeafletQuakeMarker {
    constructor(map, config, colour) {
        this.map = map;
        this.config = config;
        this._selected = false;
        this.colour = colour;
        /** @prop this._marker.addTo */
        /** @prop this._marker.setLatLng */
        /** @prop this._marker.setStyle */
        /** @prop this._marker.setRadius */
        /** @prop this._marker.getLatLng */
        this._marker = null;
    }

    static convertPosition(lat, long) {
        return [lat, long < 0 ? long + 360 : long];
    }

    update(quake) {
        const position = LeafletQuakeMarker.convertPosition(quake.lat, quake.long);
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

        let green = Math.trunc(Math.abs((1 - mag / maxMag) * 255));
        green = (green > 255 ? 255 : green).toString(16);
        if (green.length == 1) {
            green = '0' + green;
        }
        let red = Math.trunc(mag / maxMag * 255);
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
        let zoom = 6;
        if (latRange < 4 && longRange < 4) {
            zoom = 8;
        } else if (latRange < 8 && longRange < 8) {
            zoom = 7;
        }
        map.setView(LeafletQuakeMarker.convertPosition(avgLat, avgLong), zoom);
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

export default async function createLeafletMap(mapElement, accessToken, styleBuilder) {
    const mapReady = loadScript('//unpkg.com/leaflet@1.6.0/dist/leaflet.js');
    loadStyle('//unpkg.com/leaflet@1.6.0/dist/leaflet.css');
    await mapReady;
    const map = L.map(mapElement, {zoomControl: false}).setView(LeafletQuakeMarker.convertPosition(-41.5, 174), 6);

    L.tileLayer('https://api.mapbox.com/styles/v1/{style}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        style: styleBuilder ? styleBuilder('leaflet') : 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken
    }).addTo(map);

    return new QuakeMap(map, LeafletQuakeMarker);
}