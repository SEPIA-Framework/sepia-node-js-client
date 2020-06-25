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

module.exports = { sendJsonOrError };