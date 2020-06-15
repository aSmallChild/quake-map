export default class GoogleQuakeMarker {
    constructor(map, config, colour) {
        this.map = map;
        this.config = config;
        this._selected = false;
        this.colour = colour;
        this._marker = null;
    }

    update(quake) {
        const position = new google.maps.LatLng(quake.lat, quake.long);
        if (this._marker) {
            this._marker.setPosition(position);
            this._marker.setIcon(this.buildIcon(quake));
        } else {
            this._marker = new google.maps.Marker({
                position: position,
                icon: this.buildIcon(quake),
                map: this.map
            });
        }
        google.maps.event.clearInstanceListeners(this._marker);
    }

    buildIcon(quake) {
        // make recent quakes more opaque
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - this.config.search_within);
        let opacity = (quake.time.getTime() - fromDate.getTime()) / (Date.now() - fromDate.getTime());
        opacity = Math.pow(opacity + 1, 5) / 32;

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: this.getQuakeFillColour(quake),
            fillOpacity: opacity,
            scale: 7 + Math.pow(2, quake.mag) / 2,
            strokeColor: this.colour,
            strokeWeight: this._selected ? 2 : 1
        };
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
        if (this.marker) {
            const icon = this.marker.getIcon();
            icon.strokeWeight = this._selected ? 2 : 1;
            this.marker.setIcon(icon);
        }
    }

    get selected() {
        return this._selected;
    }

    get marker() {
        return this._marker;
    }

    set visible(visible) {
        this.marker.setMap(visible ? this.map : null);
    }

    adjustMapZoomAndPosition(map, avgLat, avgLong, latRange, longRange) {
        map.panTo(new google.maps.LatLng(avgLat, avgLong));
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
        if (!map.getBounds().contains(this.marker.getPosition())) {
            map.panTo(this.marker.getPosition());
        }
    }

    centerMapOnMarker(map) {
        map.panTo(this.marker.getPosition())
    }

    addEventListener(event, listener) {
        this.marker.addListener(event, listener);
    }
}