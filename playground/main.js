const express = require("express");
const app = express();
const samp = require("./samp.js");

app.get("/message/:id/:message", (req, res) => {
    try {
        result = samp.natives.sendClientMessage([new samp.type.int(parseInt(req.params.id)),
                                                new samp.type.int(0xFFFFFF),
                                                new samp.type.string(req.params.message)]);


        //samp.natives.setPlayerPos([new samp.type.int(5), new samp.type.float(100), new samp.type.float(100), new samp.type.float(100)]);
        res.json({ result: result});
    } catch(e) {
        res.status(500);
        res.json({ exception: e });
    }
});

app.get("/pos/:id", (req, res) => {
    try {
        var x = new samp.type.ref();
        var y = new samp.type.ref();
        var z = new samp.type.ref();

        result = samp.natives.getPlayerPos([new samp.type.int(parseInt(req.params.id)), x, y, z]);
        res.json({ result: result, x: x.toFloat(), y: y.toFloat(), z: z.toFloat() });
    } catch(e) {
        res.status(500);
        res.json({ exception: e });
    }
});

app.get("/name/:id", (req, res) => {
    try {
        var name = new samp.type.ref(24);
        var result = samp.natives.getPlayerName([new samp.type.int(parseInt(req.params.id)),
                                             name,
                                             new samp.type.int(24)]);

        res.json({ result: result, x: name.toString(0, result) });
    }
    catch(e) {
        res.status(500);
        res.json({ exception: e });
    }
});

app.listen(8080);
