const callSepiaEndpoint = require('../http/callEndpoint');

function PingServer(config){
	
	this.getSepiaHomeStatus = function(){
		return new Promise((resolve, reject) => {
			
			var pingResults = {};
			var allGood = true;
			
			var onFinish = function(wasError){
				if (wasError){
					allGood = false;
				}
				if (pingResults["assist"] && pingResults["teach"] && pingResults["chat"]){
					pingResults.result = (allGood)? "success" : "fail";
					resolve(pingResults);
				}
			}
			
			collectSepiaHomeResults("assist", pingResults, callSepiaEndpoint(config, undefined, "assist", "ping"), onFinish);
			collectSepiaHomeResults("teach", pingResults, callSepiaEndpoint(config, undefined, "teach", "ping"), onFinish);
			collectSepiaHomeResults("chat", pingResults, callSepiaEndpoint(config, undefined, "chat", "ping"), onFinish);
		});
	}
	function collectSepiaHomeResults(field, collectionObj, resultJsonPromise, onFinish){
		resultJsonPromise.then(function(json){
			if (!json || json.result == "fail"){
				//error - output 2
				collectionObj[field] = {
					error: json
				};
				onFinish(true);
			}else{
				//result - output 1
				collectionObj[field] = json;
				onFinish(false);
			}
		}).catch(function(err){
			//error - output 2
			collectionObj[field] = {
				error: (err.message)? err.message : err
			};
			onFinish(true);
		});
	}
}

module.exports = { PingServer }
