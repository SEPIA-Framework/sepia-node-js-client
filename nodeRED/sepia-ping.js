module.exports = function(RED){

	const { sendJsonOrError } = require('./common');
	const { PingServer } = require('../http/pingServer');
	
    function SepiaHomePing(config){
        RED.nodes.createNode(this, config);
        var node = this;
		
		//retrieve SEPIA client config
        var clientConfigNode = RED.nodes.getNode(config.sepiaClientConfig);
				
		node.status({ fill: "yellow", shape: "dot", text: "not tested" });
		
        if (!clientConfigNode || !clientConfigNode.sepiaClientConfig){
			node.warn("SEPIA Home Ping - Node was missing client config.");
			node.status({ fill: "red", shape: "dot", text: "missing config" });
			return;
		}

		//send on request
		node.on('input', function(){
			node.log("SEPIA Home Ping - request sent");
			var resultJsonPromise = new PingServer(clientConfigNode.sepiaClientConfig).getSepiaHomeStatus();
			sendJsonOrError(node, resultJsonPromise, function(res){
				//good
				node.status({ fill: "green", shape: "dot", text: "success" });
			}, function(err){
				//fail
				node.status({ fill: "red", shape: "dot", text: "no connection" });
			});
		});
    }
	
	RED.nodes.registerType("sepia-home-ping", SepiaHomePing);
}
