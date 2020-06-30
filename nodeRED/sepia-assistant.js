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
		
		var useOriginalResult = config.useOriginalResult || false;
		node.useOriginalResult = useOriginalResult;
		
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
					sendJsonOrError(node, resultJsonPromise, function(res){
						//success
						if (msg.payload.useOriginalResult || useOriginalResult === true || useOriginalResult === "true"){
							//raw result
							return res;
						}else{
							//build modified result
							return modifySepiaAssistResult(endpointName, res);
						}
					});
				}
			}else{
				node.warn("SEPIA Assistant - Node was missing 'config' or 'user'.");
				node.status({ fill: "red", shape: "ring", text: "incomplete"});
			}
        });
    }
	
	function modifySepiaAssistResult(endpointName, res){
		var newJson;
		if (endpointName == "answer"){
			newJson = {
				cardInfo: res.cardInfo,
				actionInfo: res.actionInfo,
				htmlInfo: res.htmlInfo,
				answer: res.answer,
				answerClean: res.answer_clean,
				resultInfo: res.resultInfo
			}
			if (res.more){
				newJson.more = {
					language: res.more.language,
					user: res.more.user,
					certainty: res.more.certainty_lvl
				}
			}
		}else if (endpointName == "interview"){
			if (res.interview_response){
				res = res.interview_response;
				newJson = {
					answer: res.answer,
					answerClean: res.answer_clean,
					responseType: res.response_type,
					inputMiss: res.input_miss,
					dialogStage: res.dialog_stage,
					resultInfo: res.resultInfo,
					certainty: (res.more? res.more.certainty_lvl : -1)
				}
				if (res.more){
					newJson.more = {
						language: res.more.language,
						user: res.more.user
					}
				}
			}else if (res.interview_summary){
				return modifySepiaAssistResult("understand", res.interview_summary);
			}else{
				newJson = {};
			}
		}else if (endpointName == "interpret" || endpointName == "understand"){
			newJson = {
				bestDirectMatch: res.bestDirectMatch,
				command: res.command,
				parameters: res.parameters,
				language: res.language,
				certainty: res.certainty
			};
			if (res.normalized_text) newJson.normalizedText = res.normalized_text;
		}else{
			newJson = res;
		}
		newJson.result = res.result;
		return newJson;
	}
	
	RED.nodes.registerType("sepia-assistant-request", SepiaAssistant);
}
