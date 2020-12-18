# Geonet Quake Map

This is node.js app that uses the Geonet API to pull quake data. It uses socket.io to push data to the client via Websockets in order to keep the map always updated meaning the map never has to be refreshed on the clients end.

## Deployment

* Rename [config.sample.json](config.sample.json) to `config.json` and add your mapbox access token or google maps key.
* To embed trackers, add any html snippet in a file called [templates/components/trackers.html](templates/components/trackers.html).
* Can be deployed with docker. Simply run `docker-compose up --build -d` and the app will serve HTTP requests on `:8000`.

## Built With

* [Leaflet](https://leafletjs.com/) & [mapbox](https://www.mapbox.com/) - open source maps.
* [Geonet](https://geonet.org.nz/) & [GNS Science](https://gns.cri.nz/) - earthquake data.
* [Node.js](https://nodejs.org/en/) & [Socket.io](https://socket.io/) - websockets!
* [Docker](https://www.docker.com/) - This can also run in Docker.

## License

This project is licensed under the GNU GPLv3 license - see the [LICENSE](LICENSE) file for details

## Acknowledgments

* Simeon Wilson for actually coding 99% of this.
* Michael Murphy for dockerisinating and hosting everything.
