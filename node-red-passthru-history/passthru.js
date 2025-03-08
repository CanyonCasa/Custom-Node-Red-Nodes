// functional code for node-red-passthru-history...

// version...
let {name, version} = require('./package.json');

module.exports = function(RED) {
    "use strict";

    // Node-red palette passthru-history node...
    function PassthruHistoryNode(ncfg) {
        RED.nodes.createNode(this,ncfg);
        this.name = ncfg.name;
        this.limit = ncfg.limit;
        this.store = ncfg.store;
        this.history = [];
        var node = this;

        node.on("input", function(msg, send, done) {
            if (msg.hasOwnProperty("history")) { // output history
                msg.payload = node.history;
                send(msg);
                if (msg.history==='clear') node.history=[];
            } else { // update history and passthru msg unchanged
                node.history.push(node.store==='payload' ? msg.payload : msg);
                if (node.history.length>Number(node.limit)) node.history.shift();
                send(msg);
            };
            let full = node.history.length===Number(node.limit);
            node.status({ fill: full?'grey':'green', shape: full?"ring":"dot", text: node.history.length });
            if (done) done();
        });
        node.status({ fill: 'green', shape: "dot", text: "0" });    // initial state
    };

    RED.nodes.registerType("passthru-history",PassthruHistoryNode);

}

console.log(`Successfully loaded ${name}, version: ${version}`);
