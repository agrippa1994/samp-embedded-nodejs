const process = require("process");
const samp = process.binding("samp");
const types = require("./samp-types.js");

const nativeToFormat = {
    "SendClientMessage": "dds",
    "GetPlayerPos": "dRRR",
    "SetPlayerPos": "dfff",
    "GetPlayerName": "dSd",
    "GetPlayerIp": "dSd",
    "IsPlayerConnected": "d",
    "GetPlayerHealth": "dR",
    "GetMaxPlayers": "",
    "GetNetworkStats": "Sd"
};

function callNative(native) {
    if(!(native in nativeToFormat))
        throw `Invalid native ${native}`;

    var nativeFormat = nativeToFormat[native];
    if(arguments.length - 1 != nativeFormat.length)
        throw `Supplied invalid number of arguments for native ${native}`;

    var nativeArguments = [];
    var newNativeFormat = "";
    if(arguments.length > 0) {
        for(var argumentIdx = 1; argumentIdx < arguments.length; ++argumentIdx) {
            const argument = arguments[argumentIdx];
            const typeIdentifier = nativeFormat.charAt(argumentIdx - 1);
            const type = types.typeForFormat(typeIdentifier);

            if(!(argument instanceof type))
                throw `Argument ${argument.type} at index ${argumentIdx} does not conform to type ${typeIdentifier}`;

            newNativeFormat = newNativeFormat.concat(argument.format);
            nativeArguments.push(argument.buffer);
        }
    }

    return samp.invokeNative.apply(null, [native, newNativeFormat, nativeArguments.length].concat(nativeArguments));;
}

var natives = {};
for(var nativeName in nativeToFormat) {
    // some tricky workaround in order to create a function for each native
    // assigning a function directly to the map leads to strange behaviour
    function invoker(name, args) {
        return callNative.apply(null, [name].concat(args || []));
    }
    natives[nativeName.charAt(0).toLocaleLowerCase() + nativeName.slice(1)] = invoker.bind(null, nativeName);
}

module.exports = {
    natives, natives,
    type: types
}