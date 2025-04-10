// very simple echo server to test Cootie Broker HTTP interface
const http = require('node:http');
const querystring = require('node:querystring'); 

// syntax: node testWebServer


let num = 1; // unique info per message

// Create a local server to receive data from
const server = http.createServer((req, res) => {

    let path = req.url.split('?')[0];

    req.on('error', error => {
        console.error('Request error:', error);
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Request failed'}));
    });

    let msg = { msg: 'Hello World!' }; // default

    if (req.method==='GET') {
        let query = querystring.parse(req.url.split('?')[1]).q
        msg = JSON.parse(Buffer.from(query, 'base64url').toString('utf-8'));
        msg.n = num++;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(msg));
        console.log(`Request[${req.method}]: ${path} => ${JSON.stringify(msg)}`);
    };

    if (req.method==='POST') {
        let body = '';
        req.on('data', chunk=>{ body += chunk.toString('utf8'); });
        req.on('end',()=>{
            msg = JSON.parse(body);
            msg.n = num++;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(msg));
            console.log(`Request[${req.method}]: ${path} => ${JSON.stringify(msg)}`);
        })
    };

});

server.listen(8000);
console.log('server listening on 8000...');
