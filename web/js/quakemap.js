import Util from "./util.js";

export default class QuakeMap {
    constructor(map, socket, quakeInfoContainer, statsContainer) {
        this.map = map;
        this.quakeInfoContainer = quakeInfoContainer;
        this.statsContainer = statsContainer;
        this.quakes = {};
        this.config = {};
        this.colours = {
            list: ['#F90', '#F0F', '#06F', '#F9F', '#F60', '#60F', '#960', '#FF0', '#090', '#00F', '#AEF', '#C30', '#009', '#66F', '#93F', '#F00', '#606'],
            next_index: 0,
            quake_colours: {},
            ring_recent: '#0F0',
            ring_old: '#FFF'
        };
        this.selectedQuakeId = null;

        this.bindSocketEvents(socket);
    }

    bindSocketEvents(socket) {
        socket.on('all_quakes', allQuakes => {
            for (const id in this.quakes) {
                this.removeQuake(this.quakes[id], false);
            }

            for (const id in allQuakes) {
                if (allQuakes.hasOwnProperty(id)) {
                    this.addQuake(allQuakes[id]);
                }
            }
            this.updateMap();
        });

        socket.on('old_quakes', oldQuakesIds => oldQuakesIds.forEach(id => {
            if (this.quakes.hasOwnProperty(id)) {
                this.removeQuake(this.quakes[id], true);
            }
        }));
        socket.on('new_quakes', newQuakes => {
            newQuakes.forEach(quake => this.addQuake(quake));
            this.updateMap();
        });

        socket.on('stats', stats => {
            this.statsContainer.innerHTML = stats.connected_clients + ' client' + (stats.connected_clients > 1 ? 's ' : ' ');
            this.statsContainer.innerHTML += stats.unique_connections + ' viewer' + (stats.unique_connections > 1 ? 's' : '');
            Util.shrinkIn(this.statsContainer);
        });

        socket.on('config', config => this.config = config);
    }

    getNextColour(quake) {
        if (this.colours.quake_colours.hasOwnProperty(quake.id)) {
            return this.colours.list[this.colours.quake_colours[quake.id]];
        }
        const colour = this.colours.list[this.colours.next_index];
        this.colours.quake_colours[quake.id] = this.colours.next_index;
        this.colours.next_index = ++this.colours.next_index >= this.colours.list.length ? 0 : this.colours.next_index;
        return colour;
    }

    updateMap() {
        let lats = 0,
            longs = 0,
            total = 0,
            maxLat = false,
            maxLong = false,
            minLat = false,
            minLong = false,
            latestQuake = false;
        for (const id in this.quakes) {
            const quake = this.quakes[id];
            if (!latestQuake || latestQuake.time < quake.time) {
                latestQuake = quake;
            }

            if (quake.recent) {
                if (maxLat === false || quake.lat > maxLat) {
                    maxLat = quake.lat;
                }
                if (maxLong === false || quake.long > maxLong) {
                    maxLong = quake.long;
                }
                if (minLat === false || quake.lat < minLat) {
                    minLat = quake.lat;
                }
                if (minLong === false || quake.long < minLong) {
                    minLong = quake.long;
                }
                lats += quake.lat;
                longs += quake.long;
                total++;
            }
        }

        if (maxLat) {
            lats /= total;
            longs /= total;
            this.map.panTo(new google.maps.LatLng(lats, longs));
            const latRange = Math.abs(maxLat - minLat);
            const longRange = Math.abs(maxLong - minLong);
            if (latRange < 1.75 && longRange < 1.75) {
                this.map.setZoom(9);
            } else if (latRange < 4 && longRange < 4) {
                this.map.setZoom(8);
            } else if (latRange < 8 && longRange < 8) {
                this.map.setZoom(7);
            } else {
                this.map.setZoom(6);
            }
        }

        if (!this.selectedQuakeId && latestQuake && !latestQuake.infoDiv) {
            this.displaySelectedQuake(latestQuake);
        }
    }

    addQuake(quake) {
        if (this.quakes.hasOwnProperty(quake.id)) {
            this.removeQuake(this.quakes[quake.id], false);
        }

        const quakeTime = Date.parse(quake.time);
        const recentPeriod = Date.now() - this.config.highlight_quakes_within * 60000;
        quake.recent = recentPeriod < quakeTime;

        // make recent quakes more opaque
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - this.config.search_within);
        let opacity = (quakeTime - fromDate.getTime()) / (Date.now() - fromDate.getTime());
        opacity = Math.pow(opacity + 1, 5) / 32;

        quake.marker = new google.maps.Marker({
            position: new google.maps.LatLng(quake.lat, quake.long),
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: this.getQuakeFillColour(quake),
                fillOpacity: opacity,
                scale: 7 + Math.pow(2, quake.mag) / 2,
                strokeColor: quake.recent ? this.colours.ring_recent : this.colours.ring_old,
                strokeWeight: quake.recent ? 2 : 1
            },
            map: this.map
        });

        quake.marker.setZIndex(quake.recent ? 1000 : (opacity > 0.67 ? 100 : 10));

        quake.marker.addListener('click', () => {
            const alreadyDisplayed = quake.infoDiv != null;
            this.displaySelectedQuake(quake);
            if (!alreadyDisplayed) {
                this.selectedQuakeId = quake.id;
            }
        });

        quake.marker.addListener('dblclick', () => window.open(quake.url));
        quake.infoDiv = null;
        this.quakes[quake.id] = quake;

        if (quake.id == this.selectedQuakeId) {
            this.displaySelectedQuake(quake);
        } else if (quake.recent) {
            this.displayRecentQuake(quake);
        }
    }

    getQuake(id) {
        return this.quakes.hasOwnProperty(id) ? this.quakes[id] : null;
    }

    colourCodeQuake(quake) {
        const icon = quake.marker.getIcon();
        icon.strokeColor = this.getNextColour(quake);
        icon.strokeWeight = 2;
        quake.marker.setIcon(icon);
        return icon.strokeColor;
    }

    removeQuakeColour(quake) {
        const icon = quake.marker.getIcon();
        icon.strokeColor = quake.recent ? this.colours.ring_recent : this.colours.ring_old;
        icon.strokeWeight = quake.recent ? 2 : 1;
        quake.marker.setIcon(icon);
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

    buildQuakeInfoDiv(quake) {
        if (quake.infoDiv) {
            return false
        }
        quake.infoDiv = document.createElement('div');
        quake.infoDiv.classList.add('quake_info');
        quake.infoDiv.id = quake.id;
        quake.infoDiv.style.display = 'none';

        quake.infoDiv.addEventListener('mouseover', () => {
            if (!this.map.getBounds().contains(quake.marker.getPosition())) {
                this.map.panTo(quake.marker.getPosition());
            }
            for (const id in this.quakes) {
                if (this.quakes[id] != quake) {
                    this.quakes[id].marker.setVisible(false);
                }
            }
        });
        quake.infoDiv.addEventListener('mouseout', () => this.showAllMarkers());
        quake.infoDiv.addEventListener('click', () => this.map.panTo(quake.marker.getPosition()));

        return true;
    }

    displaySelectedQuake(quake) {
        const selectedQuakeDivs = this.quakeInfoContainer.getElementsByClassName("selected_quake");
        for (let i = 0; i < selectedQuakeDivs.length; i++) {
            if (selectedQuakeDivs[i].classList.contains('recent_quake')) {
                selectedQuakeDivs[i].classList.remove('selected_quake');
                continue;
            }
            const selectedQuake = this.getQuake(selectedQuakeDivs[i].id);
            if (selectedQuake) {
                this.removeQuakeColour(selectedQuake);
                selectedQuake.infoDiv = null;
            }
            Util.close(selectedQuakeDivs[i]);
        }

        if (this.selectedQuakeId != quake.id && quake.infoDiv) {
            Util.shrinkIn(quake.infoDiv);
            quake.infoDiv.classList.add('selected_quake');
            return;
        }

        if (this.buildQuakeInfoDiv(quake)) {
            this.quakeInfoContainer.prepend(quake.infoDiv);
        }

        quake.infoDiv.classList.add('selected_quake');
        if (quake.recent) {
            quake.infoDiv.classList.add('recent_quake');
        }
        this.displayQuakeInfo(quake.infoDiv, quake, this.colourCodeQuake(quake));
    }

    displayRecentQuake(quake) {
        if (this.buildQuakeInfoDiv(quake)) {
            this.quakeInfoContainer.prepend(quake.infoDiv);
        }

        quake.infoDiv.classList.add('recent_quake');
        this.displayQuakeInfo(quake.infoDiv, quake, this.colourCodeQuake(quake));
    }

    displayQuakeInfo(wrapper, quake, linkColour) {
        wrapper.innerHTML =
            `<div class="close">x</div>
            <div class="quake_field">Geonet: <a style="color:${linkColour}" href="${quake.url}" target="_blank" rel="noopener noreferrer">${quake.id}</a></div>
            <div class="quake_field">Magnitude: <span>${quake.mag.toFixed(1)}</span></div>
            <div class="quake_field">Depth: <span>${quake.depth.toFixed(1)}</span>&nbsp;km</div>
            <div class="quake_field">Time: <span>${Util.getDateTimeString(new Date(quake.time)).replace(' ', '&nbsp;')}</span></div>`;
        Util.shrinkIn(wrapper);
        wrapper.getElementsByClassName('close')[0].addEventListener('click', () => {
            Util.shrinkOut(wrapper);
            this.removeQuakeColour(quake);
            this.showAllMarkers();
            if (quake.id == this.selectedQuakeId) {
                this.selectedQuakeId = null;
            }
            quake.infoDiv = null;
        });
    }

    showAllMarkers() {
        for (const id in this.quakes) {
            const quake = this.quakes[id];
            if (quake.marker) {
                quake.marker.setVisible(true);
            }
        }
    }

    removeQuake(quake, resetColour) {
        if (quake.infoDiv) {
            Util.close(quake.infoDiv);
        }
        if (quake.marker) {
            quake.marker.setMap(null);
        }
        if (resetColour && this.colours.quake_colours.hasOwnProperty(quake.id)) {
            delete this.colours.list[this.colours.quake_colours[quake.id]];
        }
        delete this.quakes[quake.id];
    }
}