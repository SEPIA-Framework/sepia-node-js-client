module.exports = function(RED){
	
	const { Tts } = require('../http/tts');

	function sendJsonOrError(node, resultJsonPromise){
		resultJsonPromise.then(function(json){
			if (!json || json.result == "fail"){
				//error - output 2
				node.error("SEPIA TTS - request failed");
				node.send([
					null, {	payload: { error: json } }
				]);
			}else{
				//result - output 1
				node.send([
					{ payload: json	}, null
				]);
			}
		}).catch(function(err){
			//error - output 2
			node.error("SEPIA TTS - request failed");
			node.send([
				null, {	payload: { error: err } }
			]);
		});
	}
	
	function TextToSpeechInfo(config){
		RED.nodes.createNode(this, config);
        var node = this;
		
		var sepiaClientConfig;
		var sepiaUser;
		
		node.on('input', function(msg){
			//node.log("tts-get-info msg.payload: " + JSON.stringify(msg.payload));
			
			//requirements
			if (msg.payload && typeof msg.payload == "object"){
				if (msg.payload.sepiaClientConfig) sepiaClientConfig = msg.payload.sepiaClientConfig;
				if (msg.payload.sepiaUser) sepiaUser = msg.payload.sepiaUser;
				
				if (sepiaClientConfig && sepiaUser){
					node.status({ fill: "green", shape: "dot", text: "ready" });
				}else{
					node.status({ fill: "red", shape: "dot", text: "incomplete"});
				}
			
			//request
			}else{
				if (sepiaClientConfig && sepiaUser){
					node.log("SEPIA TTS - info request sent");
					var resultJsonPromise = new Tts(sepiaClientConfig, sepiaUser).getInfo();
					sendJsonOrError(node, resultJsonPromise);
				}else{
					node.warn("SEPIA TTS - Node was missing 'config' or 'user'.");
					node.status({ fill: "red", shape: "dot", text: "incomplete"});
				}
			}
		});
	}
		
    function TextToSpeechAudioUrl(config){
        RED.nodes.createNode(this,config);
        var node = this;
		
		var sepiaClientConfig;
		var sepiaUser;
		
        node.on('input', function(msg){
			//node.log("tts-get-audio msg: " + JSON.stringify(msg));
			
			//requirements
			var ttsData;
			if (msg.payload){
				if (msg.payload.sepiaClientConfig) sepiaClientConfig = msg.payload.sepiaClientConfig;
				if (msg.payload.sepiaUser) sepiaUser = msg.payload.sepiaUser;
				
				if (sepiaClientConfig && sepiaUser){
					node.status({ fill: "green", shape: "dot", text: "ready" });
				}else{
					node.status({ fill: "red", shape: "ring", text: "incomplete"});
				}
				
				if (msg.payload.data){
					ttsData = msg.payload.data;
				}else{
					return;
				}
			}
			
			//request
			if (sepiaClientConfig && sepiaUser){
				if (ttsData && ttsData.text){
					node.log("SEPIA TTS - audio request sent");
					var resultJsonPromise = new Tts(sepiaClientConfig, sepiaUser).getAudio({
						text: ttsData.text,
						lang: ttsData.lang,
						voice: ttsData.voice,
						gender: ttsData.gender,
						mood: ttsData.mood
					});
					sendJsonOrError(node, resultJsonPromise);
				}
			}else{
				node.warn("SEPIA TTS - Node was missing 'config' or 'user'.");
				node.status({ fill: "red", shape: "ring", text: "incomplete"});
			}
        });
    }
	
    RED.nodes.registerType("sepia-tts-get-info", TextToSpeechInfo);
	RED.nodes.registerType("sepia-tts-get-audio", TextToSpeechAudioUrl);
}
