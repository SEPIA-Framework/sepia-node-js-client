module.exports = function(RED){
	
	const { Config } = require('../common/config');
	
	function send(node, conf){
		node.log("SEPIA Config - sent");
		node.send({
			payload: {
				sepiaConfig: conf
			}
		});
	}
		
    function SepiaClientConfig(config){
        RED.nodes.createNode(this, config);
        var node = this;
		
		//requirements
		/*
		node.log("serverHost: " + config.serverHost);
		node.log("deviceId: " + config.deviceId);
		node.log("clientInfo: " + config.clientInfo);
		node.log("environment: " + config.environment);
		node.log("appLanguage: " + config.appLanguage);
		*/
		var sepiaConf;
		if (!config.serverHost || !config.clientInfo || !config.deviceId){
			node.warn("SEPIA Config - Node was missing data.");
			return;
		
		}else{
			sepiaConf = new Config(
				config.serverHost, 
				config.deviceId, 
				config.clientInfo, 
				config.environment, 
				config.appLanguage
			);
		}
		
		//send on request
		node.on('input', function(){
			if (sepiaConf){
				send(node, sepiaConf);
			}
		});
    }
	
	RED.nodes.registerType("config", SepiaClientConfig);
}
