# Geonet Quake Map

This is node.js app that uses the Geonet API to pull quake data. It uses socket.io to push data to the client via Websockets in order to keep the map always updated meaning the map never has to be refreshed on the clients end.

## Deployment

* Rename [config.sample.json](config.sample.json) to `config.json` and add your google maps key.
* To embed trackers, add any html snippet in a file called [templates/components/trackers.html](templates/components/trackers.html)
* Can be deployed with docker. See [howtodocker.txt](howtodocker.txt) for more information.

## Built With

* [Node.js](https://nodejs.org/en/)
* [Socket.io](https://socket.io/) - Websockets!
* [Docker](https://www.docker.com/) - This can also run in Docker.

## License

This project is licensed under the GNU GPLv3 license - see the [LICENSE](LICENSE) file for details

## Acknowledgments

* Simeon Wilson for actually coding 99% of this.
* Michael Murphy for dockerisinating and hosting everything.
