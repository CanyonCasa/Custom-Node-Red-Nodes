// functional code for node-red-persist-data...

// version...
let {name, version} = require('./package.json');

module.exports = function(RED) {
    "use strict";
    const path = require('path');
    const fsp = require('fs').promises;

    // Node-red palette persist-data node...
    function PersistDataNode(ncfg) {
        RED.nodes.createNode(this,ncfg);
        this.name = ncfg.name;
        this.delay = ncfg.delay!=='' ? ncfg.delay : '0.1';
        this.file = ncfg.file;
        this.capture = ncfg.capture;
        this.key = ncfg.key;
        this.raw = ncfg.raw;
        this.lastPayload;
        var node = this;

        function filespec(filename) {
            return filename ? (path.isAbsolute(filename) ? file : (RED.settings.fileWorkingDirectory ? 
                path.resolve(path.join(RED.settings.fileWorkingDirectory,filename)) : null)) : null;
        }

        async function recallData(node) {
            console.log('recall:', node);
            let spec = filespec(node.file);
            if (!spec) return console.error( `File ${node.file} NOT defined!`);
            try {
                let data = await fsp.readFile(spec);
                data = node.capture!=='payload' || !node.raw ? JSON.parse(data) : data;
                if (!node.capture==='payload') {
                    if (node.key) {
                        node.context.global[key] = data;
                    } else {
                        node.context.global = data;
                    };
                };
                node.send({topic: 'data', payload: data});
        } catch(e) {
            node.send({topic: 'error', payload: null, error: e});
        };

        async function saveData(node,data) {
            console.log('save:', node.file,data);
            console.log('recall:', node);
            let spec = filespec(node.file);
            if (!spec) return console.error( `File ${node.file} NOT defined!`);
            try {
                return await fsp.writeFile(spec,data);
            } catch(e) {
                node.error(e);
                return e;
            }; 
        };

        // on messages...
        node.on("input", async function(msg, send, done) {
            if (msg.hasOwnProperty("payload")) this.lastPayload = msg.payload;
            if (!msg.hasOwnProperty("save")) return;
            await saveData();
            node.status({ fill: 'green', shape:"dot", text: "Saved" });
            if (done) done();
        });

        // on stop...
        node.on("close", async function(done) {
            let data;
            switch (node.capture) {
                case 'payload': data = node.raw ? node.lastPayload : JSON.stringify(node.lastPayload);
                    break;
                case 'key': data = JSON.stringify(node.context.global.get(node.key));
                    break;
                case 'global':
                    data = JSON.stringify(node.context.global.keys().reduce((x,k)=>{x[k]=node.context.global.get(k); return x;},{}));
                    break;
            }
            await saveData(node, data);
            if (done) done();
        });

        // on start (if file defined)...
        let delay = this.delay!=='' ? Math.floor(Number(this.delay)*1000) : 0.1;
        if (node.file) setTimeout(()=>recallData(node),delay);

        node.status({ fill: 'green', shape: "dot", text: "" });    // initial state

    };

    RED.nodes.registerType("persist-data",PersistDataNode);

}

console.log(`Successfully loaded ${name}, version: ${version}`);
