export default class Quake {
    static updatableFields = ['long', 'lat', 'mag', 'depth', 'time', 'modified', 'quality'];

    constructor(id) {
        this._id = id;
        this.url = '';
    }

    get id() {
        return this._id;
    }

    get long() {
        return this._long;
    }

    set long(value) {
        this._long = value;
    }

    get lat() {
        return this._lat;
    }

    set lat(value) {
        this._lat = value;
    }

    get mag() {
        return this._mag;
    }

    set mag(value) {
        this._mag = value;
    }

    get time() {
        return this._time;
    }

    set time(value) {
        this._time = value;
    }

    get depth() {
        return this._depth;
    }

    set depth(value) {
        this._depth = value;
    }

    get quality() {
        return this._quality;
    }

    set quality(value) {
        this._quality = value;
    }

    get modified() {
        return this._modified;
    }

    set modified(value) {
        this._modified = value;
    }

    get url() {
        return this._url;
    }

    set url(value) {
        this._url = value;
    }

    equals(that) {
        if (this.id != that.id) {
            return false;
        }
        for (const field of Quake.updatableFields) {
            if (that[field] !== null && this[field] != that[field]) {
                return false;
            }
        }
        return true;
    }

    update(that) {
        for (const field of Quake.updatableFields) {
            if (that[field] !== null && this[field] != that[field]) {
                this[field] = that[field];
            }
        }
    }

    // noinspection JSUnusedGlobalSymbols
    toJSON() {
        const obj = {
            id: this.id,
            url: this.url
        };
        for (const field of Quake.updatableFields) {
            obj[field] = this[field];
        }
        return obj;
    }

    fromJSON(obj) {
        this._id = obj.id;
        this.url = obj.url;
        for (const field of Quake.updatableFields) {
            this[field] = obj[field];
        }
    }
}

