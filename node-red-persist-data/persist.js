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
        this.delay = ncfg.delay || '0.1';
        this.file = ncfg.file;
        this.capture = ncfg.capture;
        this.keys = ncfg.keys;
        this.raw = ncfg.raw;
        this.lastPayload;
        var node = this;

        function filespec(filename) {
            return filename ? path.isAbsolute(filename) ? filename : 
                path.resolve(path.join(RED.settings.fileWorkingDirectory||'./',filename)) : null;
        }

        async function recallData(node) {
            let spec = filespec(node.file);
            try {
                let data = (node.capture==='last' && node.raw) ? await fsp.readFile(spec) : JSON.parse(await fsp.readFile(spec,'utf8'));
                let tmp = {};
                if (node.capture==='last') {
                    node.lastPayload = data;
                    tmp = data;
                } else {
                    let cntxt = node.capture==='global' ? node.context().global : node.context().flow;
                    let keys = node.keys ? node.keys.split(',') : Object.keys(data);
                    keys.forEach(k=>{ cntxt.set(k,data[k]); tmp[k]=data[k]; })
                };
                node.send({topic: 'data', payload: tmp});
            } catch(e) {
                node.error(e);
                node.send({topic: 'recall error', payload: null, error: e})
            };
        }

        async function saveData(node) {
            let data = {};
            if (node.capture==='last') {
                data = node.raw ? node.lastPayload : JSON.stringify(node.lastPayload);
            } else {
                let cntxt = node.capture==='global' ? node.context().global : node.context().flow;
                let keys = node.keys ? node.keys.split(',') : cntxt.keys();
                keys.forEach(k=>{ data[k]=cntxt.get(k); })
                data = JSON.stringify(data);
            }
            let spec = filespec(node.file);
            try {
                return await fsp.writeFile(spec,data);
            } catch(e) {
                node.error(e);
                node.send({topic: 'save error', payload: null, error: e})
            }; 
        };

        // on messages...
        node.on("input", async function(msg, send, done) {
            if (msg.hasOwnProperty("save")) {
                if (msg.save) this.lastPayload = msg.payload;
                await saveData(node);
                node.status({ fill: 'green', shape:"dot", text: "Saved" });
                done();
            } else {
                if (msg.hasOwnProperty("payload")) this.lastPayload = msg.payload;
                node.status({ fill: 'green', shape:"ring", text: `${typeof this.lastPayload}` });
                done();
            };
        });

        // on stop...
        node.on("close", async function(done) {
            await saveData(node);
            done();
        });

        // on start (if file defined)...
        let delay = Math.floor(Number(this.delay)*1000);
        if (node.file) setTimeout(async ()=>{
            await recallData(node)
            node.status({ fill: 'green', shape: "dot", text: "Recalled" });    // initial state
        },delay);
    };

    RED.nodes.registerType("persist-data",PersistDataNode);

}

console.log(`Successfully loaded ${name}, version: ${version}`);
