const callSepiaEndpoint = require('../http/callEndpoint');

function RemoteAction(config, user){
	
	this.triggerKey = function(key, data){
		if (!key){
			return Promise.reject(new Error("missing 'key'"));
		}
		if (!data) data = {};
		var action = {};
		action.key = key;
		if (data.language){
			action.language = data.language;
		}
		var body = {
			action: JSON.stringify(action),
			type: "hotkey",
			channelId: (data.channelId || ""),
			deviceId: (data.deviceId || "")
		};
		var resultJsonPromise = callSepiaEndpoint(config, user, "assist", "remote-action", body);
		
		return resultJsonPromise;
	}
}

module.exports = { RemoteAction }
