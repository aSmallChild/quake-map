import twing from 'twing';
import express from 'express';
import path from 'path';

const {TwingEnvironment, TwingLoaderFilesystem} = twing;

export default (app, geonet, stats, config) => {
    const title = "Quake Map";
    const dir = process.cwd();
    const templateDir = path.join(dir, 'templates');
    const webDir = path.join(dir, 'web');
    const loader = new TwingLoaderFilesystem(templateDir);
    const twing = new TwingEnvironment(loader);
    const themes = [
        ['/', 'default'],
        ['/pipboy', 'pipboy']
    ];

    app.all('/json', (req, res) => {
        res.type('text/json');
        res.send(JSON.stringify(geonet.getAllQuakes()));
    });

    app.all('/stats', (req, res) => {
        res.type('text/json');
        res.send(JSON.stringify(stats));
    });

    themes.forEach(theme => {
        const [endpoint, template] = theme;
        app.all(endpoint, async (req, res) => {
            const output = twing.render('layout/quakemap.twig', {
                title: title,
                google_maps_key: config.google_maps_key,
                theme: template
            });
            res.type('text/html');
            res.end(await output);
        });
    });

    app.use(express.static(webDir));
}