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
							targetChannelId: (actionData.data.channelId || ""),
							targetDeviceId: (actionData.data.deviceId || "")
						}
						var resultJsonPromise = new RemoteAction(sepiaClientConfig, sepiaUser)
							.triggerKey(actionData.data.key, data);
						sendJsonOrError(node, resultJsonPromise);
						
					}else if (actionData.data && actionData.type == "sync"){
						node.log("SEPIA Remote-Action - 'sync' action sent");
						var data = {
							targetChannelId: (actionData.data.channelId || ""),
							targetDeviceId: (actionData.data.deviceId || "")
						}
						var resultJsonPromise = new RemoteAction(sepiaClientConfig, sepiaUser)
							.triggerSync(actionData.data.events, data);
						sendJsonOrError(node, resultJsonPromise);
					
					}else if (actionData.action && actionData.type){
						node.log("SEPIA Remote-Action - sending '" + actionData.type + "' action");
						var resultJsonPromise = new RemoteAction(sepiaClientConfig, sepiaUser)
							.sendAction(actionData.type, actionData.action, actionData.data);
						sendJsonOrError(node, resultJsonPromise);
						
					}else{
						node.warn("SEPIA Remote-Action - Invalid request. Missing type, action or data.");
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
