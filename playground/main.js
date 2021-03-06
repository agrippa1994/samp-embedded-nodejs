const express = require("express");
const app = express();
const samp = require("./samp.js");
const process = require("process");

app.get("/message/:id/:message", (req, res) => {
    try {
        result = samp.natives.sendClientMessage([new samp.type.int(parseInt(req.params.id)),
                                                 new samp.type.int(0xFFFFFF),
                                                 new samp.type.string(req.params.message)]);

        res.json({ result: result});
    } catch(e) {
        res.status(500);
        res.json({ exception: e });
        console.log(e);
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
        console.log(e);
    }
});

app.get("/name/:id", (req, res) => {
    try {
        var name = new samp.type.stringref(24);
        var result = samp.natives.getPlayerName([new samp.type.int(parseInt(req.params.id)),
                                                 name,
                                                 new samp.type.int(name.size)]);
        res.json({ result: result, x: name.toString() });
    }
    catch(e) {
        res.status(500);
        res.json({ exception: e });
        console.log(e);
    }
});

app.get("/networkstats", (req, res) => {
    try {
        var stats = new samp.type.stringref(1024);
        var result = samp.natives.getNetworkStats([stats, new samp.type.int(stats.size)]);
        res.json({ result: result, stats: stats.toString() });
    }
    catch(e) {
        res.status(500);
        res.json({ exception: e });
        console.log(e);
    }
});

app.get("/playerinfo", (req, res) => {
    try {
        var playerInfo = [];
        for(var idx = 0; idx < samp.natives.getMaxPlayers(); ++idx) {
            var playerid = new samp.type.int(idx);

            if(!samp.natives.isPlayerConnected([playerid]))
                continue;

            var health = new samp.type.ref();
            samp.natives.getPlayerHealth([playerid, health]);

            var x = new samp.type.ref();
            var y = new samp.type.ref();
            var z = new samp.type.ref();
            samp.natives.getPlayerPos([playerid, x, y, z]);

            var name = new samp.type.stringref(24);
            var nameLength = samp.natives.getPlayerName([playerid, name, new samp.type.int(name.size)]);

            var ip = new samp.type.stringref(16);
            var ipLength = samp.natives.getPlayerIp([playerid, ip, new samp.type.int(ip.size)]);

            playerInfo.push({ x: x.toFloat(),
                y: y.toFloat(),
                z: z.toFloat(),
                name: name.toString(),
                ip: ip.toString(),
                health: health.toFloat()
            });
        }
        res.json(playerInfo);
    }
    catch(e) {
        res.status(500);
        res.json({ exception: e });
        console.log(e);
    }
});

app.get("/init", (req, res) => {
    try {
        const result1= samp.public("OnGameModeInit", "");
        const result2= samp.public("OnPlayerConnect", "d", new samp.type.int(0));
        const result3 = samp.public("OnPlayerDeath", "ddd", new samp.type.int(0), new samp.type.int(0), new samp.type.int(0));
        res.json({ result1: result1, result2: result2, result3: result3 });
    }
    catch(e) {
        res.status(500);
        res.json({ exception: e });
        console.log(e);
    }
});

app.listen(8080);
