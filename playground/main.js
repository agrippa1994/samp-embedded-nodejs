const express = require("express");
const app = express();
const samp = require("./samp.js");

app.get("/api/:id/:message", (req, res) => {
    try {
        result = samp.natives.sendClientMessage([new samp.type.int(parseInt(req.params.id)), 
                                                new samp.type.int(0xFFFFFF), 
                                                new samp.type.string(req.params.message)]);
        res.json({ result: result});
    } catch(e) {
        res.status(500);
        res.json({ exception: e });
    }
});

app.listen(8080);
