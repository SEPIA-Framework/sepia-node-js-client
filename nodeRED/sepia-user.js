module.exports = function(RED){
	
	const { User } = require('../common/user');
	
	function send(node, conf, usr){
		node.log("SEPIA User - sent");
		node.send({
			payload: {
				sepiaUser: usr,
				sepiaClientConfig: conf
			}
		});
	}
		
    function SepiaUser(config){
        RED.nodes.createNode(this, config);
        var node = this;
		
		//retrieve SEPIA client config
        var clientConfigNode = RED.nodes.getNode(config.sepiaClientConfig);
		
		//requirements
		
		//node.log("DEBUG - userId: " + node.credentials.userId);
		//node.log("DEBUG - pwd: " + node.credentials.pwd);
		//node.log("DEBUG - sepiaClientConfig: " + clientConfigNode.sepiaClientConfig);
		
		var sepiaUser;
		if (!clientConfigNode || !clientConfigNode.sepiaClientConfig || !node.credentials.userId || !node.credentials.pwd){
			node.warn("SEPIA User - Node was missing client config, user ID or password.");
			return;
			
		}else{
			sepiaUser = new User(
				clientConfigNode.sepiaClientConfig,
				node.credentials.userId, 
				node.credentials.pwd
			);
			//auth. user
			node.status({ fill: "yellow", shape: "dot", text: "authenticating"});
			sepiaUser.authenticate(function(usr){
				node.log("SEPIA User - id: " + node.credentials.userId + " authenticated");
				node.status({ fill: "green", shape: "dot", text: node.credentials.userId });
			}, function(err){
				node.warn("SEPIA User - id: " + node.credentials.userId + " NOT authenticated!");
				node.status({ fill: "red", shape: "dot", text: "not authenticated"});
			});
		}

		//send on request
		node.on('input', function(){
			if (sepiaUser){
				send(node, clientConfigNode.sepiaClientConfig, sepiaUser);
			}
		});
    }
	
	RED.nodes.registerType("sepia-user", SepiaUser, {
		credentials: {
			userId: { type: "text" },
			pwd: { type: "password" }
		}
	});
}
