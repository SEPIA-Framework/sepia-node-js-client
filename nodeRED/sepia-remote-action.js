module.exports = function(RED){

	const { sendJsonOrError } = require('./common');
	const { RemoteAction } = require('../abilities/remote-action');
	
    function SepiaRemoteAction(config){
        RED.nodes.createNode(this, config);
        var node = this;
		
		var sepiaClientConfig;
		var sepiaUser;
		
		node.status({ fill: "yellow", shape: "dot", text: "add user" });
		
        node.on('input', function(msg){
			//requirements
			var actionData;
			if (msg.payload){
				if (msg.payload.sepiaClientConfig) sepiaClientConfig = msg.payload.sepiaClientConfig;
				if (msg.payload.sepiaUser) sepiaUser = msg.payload.sepiaUser;
				
				if (sepiaClientConfig && sepiaUser){
					node.status({ fill: "green", shape: "dot", text: "ready" });
				}else{
					node.status({ fill: "red", shape: "ring", text: "incomplete"});
				}
				
				if (msg.payload.action){
					actionData = msg.payload.action;
				}else{
					return;
				}
			}
			
			//request
			if (sepiaClientConfig && sepiaUser){
				if (actionData){
					if (actionData.data && actionData.type == "hotkey"){
						node.log("SEPIA Remote-Action - 'hotkey' action sent");
						var data = {
							language: (actionData.data.language || ""),
							channelId: (actionData.data.channelId || ""),
							deviceId: (actionData.data.deviceId || "")
						}
						var resultJsonPromise = new RemoteAction(sepiaClientConfig, sepiaUser)
							.triggerKey(actionData.data.key, data);
						sendJsonOrError(node, resultJsonPromise);
					}else{
						node.warn("SEPIA Remote-Action - Unknown action type or missing data.");
						node.status({ fill: "red", shape: "ring", text: "invalid request"});
					}
				}
			}else{
				node.warn("SEPIA Remote-Action - Node was missing 'config' or 'user'.");
				node.status({ fill: "red", shape: "ring", text: "incomplete"});
			}
        });
    }
	
	RED.nodes.registerType("sepia-remote-action", SepiaRemoteAction);
}
