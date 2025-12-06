import {shrinkIn, shrinkOut, close, getDateTimeString} from './util.js';
import Quake from './quake.js';

class QuakeWrapper {
    constructor(quake, colour) {
        this.quake = quake;
        this.marker = null;
        this.colour = colour;
        this.buildQuakeInfoDiv();
    }

    get id() {
        return this.quake.id;
    }

    set selected(isSelected) {
        this._selected = isSelected;
        this.marker.selected = isSelected;
        if (isSelected) {
            this.visible = true;
        }

        if (isSelected && !this.infoDiv.classList.contains('selected_quake')) this.infoDiv.classList.add('selected_quake');
        else this.infoDiv.classList.remove('selected_quake');
    }

    get selected() {
        return this._selected;
    }

    set visible(visible) {
        this.marker.visible = visible;
        this.infoVisible = visible;
    }

    destroy() {
        this.marker.visible = false;
        close(this.infoDiv);
    }

    buildQuakeInfoDiv() {
        this.infoDiv = document.createElement('div');
        this.infoDiv.classList.add('quake_info');
        this.infoDiv.style.display = 'none';
    }

    updateInfoDiv(quake) {
        this.infoDiv.innerHTML =
            `<div class="close">x</div>
            <div class="quake_field">Geonet: <a style="color:${this.colour}" href="${quake.url}" target="_blank" rel="noopener noreferrer">${quake.id}</a></div>
            <div class="quake_field">Magnitude: <span>${quake.mag.toFixed(1)}</span></div>
            <div class="quake_field">Depth: <span>${quake.depth.toFixed(1)}</span>&nbsp;km</div>
            <div class="quake_field">Time: <span>${getDateTimeString(new Date(quake.time)).replace(' ', '&nbsp;')}</span></div>`;
        this.infoDiv.querySelector('.close').addEventListener('click', e => {
            e.cancelBubble = true;
            shrinkOut(this.infoDiv);
        });

        if (this.quake.recent) this.infoDiv.classList.add('recent_quake');
        else this.infoDiv.classList.remove('recent_quake');
    }

    set infoVisible(visible) {
        if (visible) shrinkIn(this.infoDiv);
        else shrinkOut(this.infoDiv);
    }

    update() {
        this.marker.update(this.quake);
        const newDiv = this.infoDiv.cloneNode(true);
        this.infoDiv.parentNode.replaceChild(newDiv, this.infoDiv);
        this.infoDiv = newDiv;
        this.updateInfoDiv(this.quake);
    }
}

export default class QuakeMap {
    constructor(map, markerClass) {
        this.map = map;
        this.markerClass = markerClass;
        this.markers = [];
        this.config = {};
        this.colours = {
            list: ['#F90', '#F0F', '#06F', '#F9F', '#F60', '#60F', '#960', '#FF0', '#090', '#00F', '#AEF', '#C30', '#009', '#66F', '#93F', '#F00', '#606'],
            next_index: 0,
        };
    }

    setQuakeInfoContainer(quakeInfoContainer) {
        this.quakeInfoContainer = quakeInfoContainer;
    }

    on(event, data) {
        switch (event) {
            case 'all_quakes':
                return this.handleEventAllQuakes(data);
            case 'old_quakes':
                return this.handleEventOldQuakes(data);
            case 'new_quakes':
                return this.handleEventNewQuakes(data);
            case 'config':
                return this.handleEventConfig(data);
        }
    }

    handleEventAllQuakes(allQuakes) {
        const ids = new Set();
        for (const quake of allQuakes) {
            this.addQuakeData(quake);
            ids.add(quake.id);
        }

        this.markers = this.markers.filter(marker => {
            if (!ids.has(marker.id)) {
                marker.destroy();
                return false;
            }
            return true;
        });
        this.recenterMap();
    }

    handleEventOldQuakes(oldQuakesIds) {
        this.markers = this.markers.filter(marker => {
            if (oldQuakesIds.includes(marker.id)) {
                marker.destroy();
                return false;
            }
            return true;
        });
    }

    handleEventNewQuakes(newQuakes) {
        newQuakes.forEach(quake => this.addQuakeData(quake));
        this.recenterMap();
    }

    handleEventConfig(config) {
        this.config = config;
    }

    getNextColour() {
        const colour = this.colours.list[this.colours.next_index];
        this.colours.next_index = ++this.colours.next_index >= this.colours.list.length ? 0 : this.colours.next_index;
        return colour;
    }

    recenterMap() {
        let lats = 0,
            longs = 0,
            total = 0,
            maxLat = null,
            maxLong = null,
            minLat = null,
            minLong = null,
            /** @var {QuakeWrapper} */
            selectedMarker = null,
            /** @var {QuakeWrapper} */
            latestMarker = null;
        for (const marker of this.markers) {
            if (marker.selected) {
                selectedMarker = marker;
            }
            const quake = marker.quake;
            if (!latestMarker || latestMarker.quake.time < quake.time) {
                latestMarker = marker;
            }

            if (quake.recent) {
                maxLat = maxLat === null ? quake.lat : Math.max(quake.lat, maxLat);
                maxLong = maxLong === null ? quake.long : Math.max(quake.long, maxLong);
                minLat = minLat === null ? quake.lat : Math.min(quake.lat, minLat);
                minLong = minLong === null ? quake.long : Math.min(quake.long, minLong);
                lats += quake.lat;
                longs += quake.long;
                total++;
            }
        }

        if (latestMarker && maxLat) {
            lats /= total;
            longs /= total;
            const latRange = Math.abs(maxLat - minLat);
            const longRange = Math.abs(maxLong - minLong);
            latestMarker.marker.adjustMapZoomAndPosition(this.map, lats, longs, latRange, longRange);
        }

        if (!selectedMarker && latestMarker) {
            latestMarker.selected = true;
        }
    }

    addQuakeData(quakeData) {
        let marker = this.markers.find(m => m.id == quakeData.id);
        if (marker) {
            marker.quake.update(quakeData);
        } else {
            const quake = Quake.fromJSON(quakeData);
            quake.recent = (this.config?.highlight_quakes_within ?? 5) * 60000;
            marker = new QuakeWrapper(quake, this.getNextColour());
            marker.marker = new this.markerClass(this.map, this.config, marker.colour);
            this.markers.push(marker);
            this.quakeInfoContainer.appendChild(marker.infoDiv);
        }
        marker.update();
        marker.marker.addEventListener('click', () => {
            for (const otherMarker of this.markers) {
                if (otherMarker == marker) continue;

                otherMarker.selected = false;
                if (!otherMarker.quake.recent) {
                    otherMarker.infoVisible = false;
                }
            }
            marker.selected = true;
        });
        marker.marker.addEventListener('dblclick', () => window.open(marker.quake.url));

        marker.infoDiv.addEventListener('mouseover', () => {
            marker.marker.ensureMarkerIsInView(this.map);
            this.hideAllMarkersExcept(marker.id);
        });
        marker.infoDiv.addEventListener('mouseout', () => this.showAllMarkers());
        marker.infoDiv.addEventListener('click', () => marker.marker.centerMapOnMarker(this.map));

        if (marker.selected || marker.quake.recent) {
            marker.visible = true;
        }
    }

    showAllMarkers() {
        for (const marker of this.markers) {
            marker.marker.visible = true;
        }
    }

    hideAllMarkersExcept(excludedId) {
        for (const marker of this.markers) {
            if (marker.id != excludedId) {
                marker.marker.visible = false;
            }
        }
    }
}