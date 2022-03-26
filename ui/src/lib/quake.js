const updatableFields = ['long', 'lat', 'mag', 'depth', 'time', 'modified', 'quality'];

export default class Quake {
    #id;
    #time;
    #recentForSeconds = 300;
    url;
    modified;
    quality;
    depth;
    mag;
    lat;
    long;

    constructor(id) {
        this.#id = id;
    }

    get id() {
        return this.#id;
    }

    get time() {
        return this.#time;
    }

    set time(value) {
        this.#time = new Date(value);
    }

    set recent(seconds) {
        this.#recentForSeconds = seconds;
    }

    get recent() {
        const recentPeriod = Date.now() - this.#recentForSeconds;
        return recentPeriod < this.time.getTime();
    }

    equals(that) {
        if (this.id != that.id) {
            return false;
        }
        for (const field of updatableFields) {
            if (that[field] === null) {
                continue;
            }

            if (field == 'time') {
                if (!this.time || this.time.getTime() != that.time.getTime()) {
                    return false;
                }
            }
            else if (this[field] != that[field]) {
                return false;
            }
        }
        return true;
    }

    update(that) {
        for (const field of updatableFields) {
            if (that[field] !== null && this[field] != that[field]) {
                this[field] = that[field];
            }
        }
    }

    // noinspection JSUnusedGlobalSymbols
    toJSON() {
        return Object.fromEntries([
            ['id', this.id],
            ['url', this.url],
            ...updatableFields.map(field => [field, this[field]]),
        ]);
    }

    static fromJSON(obj) {
        const quake = new Quake(obj.id);
        quake.url = obj.url;
        for (const field of updatableFields) {
            quake[field] = obj[field];
        }
        return quake;
    }
}

