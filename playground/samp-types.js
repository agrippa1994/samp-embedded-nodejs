
module.exports.int = class {
    constructor(value) {
        this.type = "int";
        this.format = "i";
        this.buffer = new Buffer(4);
        this.buffer.writeInt32LE(value);
    }

    static get format() {
        return "d";
    }
};

module.exports.float = class {
    constructor(value) {
        this.type = "f";
        this.buffer = new Buffer(4);
        this.buffer.writeFloatLE(value);
    }

    static get format() {
        return "f";
    }
};

module.exports.string = class {
    constructor(value) {
        this.type = "string";
        this.format = "s";
        this.buffer = new Buffer(value + "\0");
    }

    static get format() {
        return "s";
    }
};

module.exports.ref = class {
    constructor(size=4) {
        this.type = "ref";
        this.buffer = new Buffer(size);
    }

    toFloat() {
        return this.buffer.readFloatLE();
    }

    toInt() {
        return this.buffer.readInt32LE();
    }

    static get format() {
        return "R";
    }
}

module.exports.stringref = class {
    constructor(size=32) {
        this.type = "stringref";
        this.buffer = new Buffer(size);
    }

    toString(start, end) {
        return this.buffer.toString("ascii", start, end);
    }

    static get format() {
        return "S";
    }
}

module.exports.typeForFormat = (format) => {
    for(type in module.exports) {
        const constructor = module.exports[type];
        if(constructor.format === format)
            return constructor;
    }
}
