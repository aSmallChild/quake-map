import Quake from '../src/lib/quake.js';


test('Quake.equals()', () => {
    for (let i = 0; i < 100; i++) {
        const quakeJSON = {
            id: 'a',
            lat: 123 + Math.random(),
            long: 456 + Math.random(),
            mag: 7 + Math.random(),
            depth: 321 + Math.random(),
            time: '2016-11-15T06:30:33.216Z',
            modified: '2016-11-15T06:30:33.216Z',
            quality: 'best',
            url: 'https://earthquake.com/a'
        };

        const quake1 = Quake.fromJSON(quakeJSON);
        const quake2 = Quake.fromJSON(quakeJSON);

        expect(quake1.equals(quake1)).toEqual(true);
        expect(quake1.equals(quake2)).toEqual(true);
    }
})