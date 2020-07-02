const callSepiaEndpoint = require('../http/callEndpoint');

function RemoteAction(config, user){
	
	var that = this;
	
	this.triggerKey = function(key, data){
		if (!key){
			return Promise.reject(new Error("missing 'key'"));
		}
		var action = {
			key: key
		};
		if (data && data.language){
			action.language = data.language;
		}
		return that.sendAction("hotkey", action, data);
	}
	
	this.triggerSync = function(events, data){
		if (!events){
			return Promise.reject(new Error("missing 'events'"));
		}
		var action = {
			events: events,
			forceUpdate: true
		};
		return that.sendAction("sync", action, data);
	}
	
	this.sendAction = function(type, action, data){
		if (!data) data = {};
		var body = {
			action: JSON.stringify(action),
			type: type,
			targetChannelId: (data.targetChannelId || ""),
			targetDeviceId: (data.targetDeviceId || "")
		};
		var resultJsonPromise = callSepiaEndpoint(config, user, "assist", "remote-action", body);
		
		return resultJsonPromise;
	}
}

module.exports = { RemoteAction }
