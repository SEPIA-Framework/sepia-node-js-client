module.exports = function(RED){
	
	const { Config } = require('../common/config');
		
    function SepiaClientConfig(config){
        RED.nodes.createNode(this, config);
        var node = this;
		
		//requirements
		/*
		node.log("serverHost: " + config.serverHost);
		node.log("serverHost: " + node.serverHost);
		node.log("deviceId: " + config.deviceId);
		node.log("clientInfo: " + config.clientInfo);
		node.log("environment: " + config.environment);
		node.log("appLanguage: " + config.appLanguage);
		*/
		
		node.name = config.name || "sepia client 1";
		node.serverHost = config.serverHost || "localhost";
		node.deviceId = config.deviceId || "n1";
		node.clientInfo = config.clientInfo || "node_red";
		node.environment = config.environment || "default";
		node.appLanguage = config.appLanguage || "en";
		
		node.sepiaClientConfig = new Config(node.serverHost, node.deviceId, node.clientInfo, node.environment, node.appLanguage);
    }
	
	RED.nodes.registerType("sepia-client-config", SepiaClientConfig);
}
