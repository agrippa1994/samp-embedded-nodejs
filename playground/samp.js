const process = require("process");
const samp = process.binding("samp");


class int {
    constructor(value) {
        this.type = "int";
        this.buffer = new Buffer(4);
        this.buffer.writeInt32LE(value);
    }
};

class float {
    constructor(value) {
        this.type = "float";
        this.buffer = new Buffer(4);
        this.buffer.writeFloatLE(value);
    }
};

class string {
    constructor(value) {
        this.type = "string";
        this.buffer = new Buffer(value + "\0");
    }
};

class floatRef {
    constructor(value) {
        this.type = "floatRef";
        this.buffer = new Buffer(4);
        this.buffer.writeFloatLE(value);
    }

    get() {
        return this.buffer.readFloatLE(0);
    }
}
const typeToFormat = {
    "s": string,
    "i": int,
    "d": int,
    "f": float,
    "R": floatRef
};

const nativeToFormat = {
    "SendClientMessage": "dds"
    //"GetPlayerPos": "dRRR"
};

function callNative(native) {
    console.trace();
    console.log(JSON.stringify(arguments, null, 4));
    if(!(native in nativeToFormat))
        throw `Invalid native ${native}`;

    nativeFormat = nativeToFormat[native];
    if(arguments.length - 1 != nativeFormat.length)
        throw "Supplied invalid number of arguments.";

    nativeArguments = [];
    if(arguments.length > 0) {
        for(var argumentIdx = 1; argumentIdx < arguments.length; ++argumentIdx) {
            const argument = arguments[argumentIdx];
            const typeIdentifier = nativeFormat.charAt(argumentIdx - 1);
            const type = typeToFormat[typeIdentifier];

            if(!(argument instanceof type))
                throw `Argument ${argument.type} at index ${argumentIdx} does not conform to type ${typeIdentifier}`;

            nativeArguments.push(argument.buffer);
        }
    }
    console.log("NATIVE " + native + " NativeFormat: " + nativeFormat + ", arguments: " + JSON.stringify(nativeArguments));
    return samp.invokeNative.apply(null, [native, nativeFormat].concat(nativeArguments));
}

var natives = {};
for(var nativeName in nativeToFormat) {

    function X(name, args) {
        return callNative.apply(null, [name].concat(args));
    }

    natives[nativeName.charAt(0).toLocaleLowerCase() + nativeName.slice(1)] = X.bind(null, nativeName);

}

natives.sendClientMessage([new int(5), new int(10), new string("adsfaf")]);
//natives.getPlayerPos(new int(5), new int(10), new string("adsfaf"));

module.exports = {
    internal: samp,
    invokeNative: samp.invokeNative,
    natives, natives,
    type: {
        int: int,
        float: float,
        string: string
    },

    invokePublic: () => {
        return samp.invokeNative.apply(["CallRemoteFunction"] + arguments);
    }
}