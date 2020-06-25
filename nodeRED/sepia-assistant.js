module.exports = function(RED){
	
	const { Assistant } = require('../abilities/assistant');
	const { sendJsonOrError } = require('./common');
	
    function SepiaAssistant(config){
        RED.nodes.createNode(this, config);
        var node = this;
				
		var sepiaClientConfig;
		var sepiaUser;
		var assistant;
		
		var defaultEndpoint = config.defaultEndpoint || "answer";
		node.defaultEndpoint = defaultEndpoint;
		
		node.status({ fill: "yellow", shape: "dot", text: "add user" });
		
        node.on('input', function(msg){
			//node.log("tts-get-audio msg: " + JSON.stringify(msg));
			
			//requirements
			var inputData;
			if (msg.payload){
				if (msg.payload.sepiaClientConfig){
					sepiaClientConfig = msg.payload.sepiaClientConfig;
					assistant = undefined;		//reset for new client config
				}
				if (msg.payload.sepiaUser){
					sepiaUser = msg.payload.sepiaUser;
					assistant = undefined;		//reset for new user
				}
				
				if (sepiaClientConfig && sepiaUser){
					node.status({ fill: "green", shape: "dot", text: "ready" });
				}else{
					node.status({ fill: "red", shape: "ring", text: "incomplete"});
				}
				
				//TODO: add clientWorldLocation, deviceLocalSite, prefTempUnit
				
				if (msg.payload.input){
					inputData = msg.payload.input;
				}else{
					return;
				}
			}
			
			//request
			if (sepiaClientConfig && sepiaUser){
				if (!assistant){
					assistant = new Assistant(sepiaClientConfig, sepiaUser);
				}
				if (inputData && inputData.text){
					//select endpoint
					var endpointName = msg.payload.endpoint || defaultEndpoint;
					var endpoint = assistant[endpointName];
					if (!endpoint){
						node.warn("SEPIA Assistant - Endpoint unknown: " + endpointName);
						return;
					}else{
						node.log("SEPIA Assistant - request sent");
					}
					var resultJsonPromise = endpoint(inputData);
					sendJsonOrError(node, resultJsonPromise);
				}
			}else{
				node.warn("SEPIA Assistant - Node was missing 'config' or 'user'.");
				node.status({ fill: "red", shape: "ring", text: "incomplete"});
			}
        });
    }
	
	RED.nodes.registerType("sepia-assistant-request", SepiaAssistant);
}
