function sendJsonOrError(node, resultJsonPromise, onSuccess, onFail){
	resultJsonPromise.then(function(json){
		if (!json || json.result == "fail"){
			//error - output 2
			node.error("SEPIA - request failed");
			if (onFail) onFail(json);
			node.send([
				null, {	payload: { error: json } }
			]);
		}else{
			//result - output 1
			if (onSuccess){ 
				var jsonMod = onSuccess(json);
				if (jsonMod) json = jsonMod;
			}
			node.send([
				{ payload: json	}, null
			]);
		}
	}).catch(function(err){
		//error - output 2
		node.error("SEPIA - request failed");
		if (onFail) onFail(err);
		node.send([
			null, {	payload: { error: (err.message)? err.message : err } }
		]);
	});
}

module.exports = { sendJsonOrError };