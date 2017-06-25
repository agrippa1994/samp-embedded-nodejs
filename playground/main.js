const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const website = `
    <html>
        <head>
            <title>Test</title>
        </head>
        <body>
            <a href="/api">test</a>
        </body>
    </html>
`;

app.use(bodyParser.json());

app.get("/api/:id/:message", (req, res) => {
    try {
        const arg1 = new Buffer(4);
        arg1.writeInt32LE(parseInt(req.params.id));

        const arg2 = new Buffer(4);
        arg2.writeInt32LE(0xFFFFFF);

        const arg3 = new Buffer(req.params.message + "\0");
        result = process.binding("samp").invokeNative("SendClientMessage", "dds", arg1, arg2, arg3);
        res.json({ result: result});
    } catch(e) {
        console.log(`EXCEPTION: ${e}`);
        res.end("exception bla " + e);
    }
});

app.get("/pos/:id", (req, res) => {
    try {
        const arg1 = new Buffer(4);
        arg1.writeInt32LE(parseInt(req.params.id));

        const arg2 = new Buffer(4);
        const arg3 = new Buffer(4);
        const arg4 = new Buffer(4);

        result = process.binding("samp").invokeNative("GetPlayerPos", "dRRR", arg1, arg2, arg3, arg4);
    
        res.json({ result: result, x: arg2.readFloatLE(), y: arg3.readFloatLE(), z: arg4.readFloatLE() });
        res.end();
    } catch(e) {
        res.end("EXCEPTION: " + e);
    }
});

app.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.end(website);
});

app.listen(8080);

