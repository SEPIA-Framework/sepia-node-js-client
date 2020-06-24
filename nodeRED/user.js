module.exports = function(RED){
	
	const { User } = require('../common/user');
	
	function send(node, usr){
		node.log("SEPIA User - sent");
		node.send({
			payload: {
				sepiaUser: usr
			}
		});
	}
		
    function SepiaUser(config){
        RED.nodes.createNode(this, config);
        var node = this;
		
		//requirements
		/*
		node.log("userId: " + config.userId);
		node.log("pwd: " + config.pwd);
		node.log("userPrefLanguage: " + config.userPrefLanguage);
		*/
		var sepiaUser;
		if (!config.userId || !config.pwd){
			node.warn("SEPIA User - Node was missing user ID or password.");
			return;
			
		}else{
			sepiaUser = new User(
				config.userId, 
				config.pwd, 
				config.userPrefLanguage
			);
		}

		//send on request
		node.on('input', function(){
			if (sepiaUser){
				send(node, sepiaUser);
			}
		});
    }
	
	RED.nodes.registerType("user", SepiaUser);
}
