import createGoogleMap from './map-google.js';
import createLeafletMap from './map-leaflet.js';
import {registerSocketListener} from './client-socket-handler.js';

export async function createMap(mapContainer, quakeInfoContainer, styleBuilder, onMapCreated) {
    const quakeMap = await createMapType(mapContainer, styleBuilder);
    quakeMap.setQuakeInfoContainer(quakeInfoContainer);
    if (onMapCreated) {
        onMapCreated(quakeMap);
    }
    registerSocketListener((event, data) => quakeMap.on(event, data));
}

function createMapType(mapContainer, styleBuilder) {
    if (import.meta.env.VITE_GOOGLE_MAP_KEY) {
        return createGoogleMap(mapContainer, import.meta.env.VITE_GOOGLE_MAP_KEY, styleBuilder);
    }
    if (import.meta.env.VITE_LEAFLET_ACCESS_TOKEN) {
        return createLeafletMap(mapContainer, import.meta.env.VITE_LEAFLET_ACCESS_TOKEN, styleBuilder);
    }
    throw new Error('No public map API key configured.');
}