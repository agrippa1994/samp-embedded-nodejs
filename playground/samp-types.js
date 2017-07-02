
module.exports.int = class {
    constructor(value) {
        this.type = "int";
        this.buffer = new Buffer(4);
        this.buffer.writeInt32LE(value);
    }

    static get format() {
        return "d";
    }

    get format() {
        return "d";
    }
};

module.exports.float = class {
    constructor(value) {
        this.type = "float";
        this.buffer = new Buffer(4);
        this.buffer.writeFloatLE(value);
    }

    static get format() {
        return "f";
    }

    get format() {
        return "f";
    }
};

module.exports.string = class {
    constructor(value) {
        this.type = "string";
        this.buffer = new Buffer(value + "\0");
    }

    static get format() {
        return "s";
    }

    get format() {
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

    get format() {
        return "R";
    }
}

module.exports.stringref = class {
    constructor(size=32) {
        this.type = "stringref";

        // sampgdk pushes string references as an cell array internally.
        // Thus we need to allocate 4 times more memory
        this.buffer = new Buffer(size * 4 + 1);
    }

    get size() {
        return (this.buffer.length - 1) / 4
    }

    toString() {
        return this.buffer.toString("ascii").split("\0").shift();
    }

    static get format() {
        return "S";
    }

    get format() {
        return `S[${this.size}]`;
    }
}

module.exports.typeForFormat = (format) => {
    for(type in module.exports) {
        const constructor = module.exports[type];
        if(constructor.format === format)
            return constructor;
    }
}
