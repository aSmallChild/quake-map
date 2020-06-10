const {TwingEnvironment, TwingLoaderFilesystem} = require('twing');
const express = require('express');
const path = require('path');

module.exports = (server, geonet, stats, config) => {
    const title = "Quake Map";
    const templateDir = path.join(__dirname, '..', 'templates');
    const webDir = path.join(__dirname, '..', 'web');
    const loader = new TwingLoaderFilesystem(templateDir);
    const twing = new TwingEnvironment(loader);
    const themes = [
        ['/', 'default'],
        ['/pipboy', 'pipboy']
    ];

    server.all('/json', (req, res) => {
        res.type('text/json');
        res.send(JSON.stringify(geonet.getAllQuakes()));
    });

    server.all('/stats', (req, res) => {
        res.type('text/json');
        res.send(JSON.stringify(stats));
    });

    themes.forEach(theme => {
        const [endpoint, template] = theme;
        server.all(endpoint, async (req, res) => {
            const output = twing.render('layout/quakemap.twig', {
                title: title,
                google_maps_key: config.google_maps_key,
                theme: template
            });
            res.type('text/html');
            res.end(await output);
        });
    });

    server.use(express.static(webDir));
}