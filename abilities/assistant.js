const callSepiaEndpoint = require('../http/callEndpoint');

function Assistant(config, user, clientWorldLocation, deviceLocalSite, prefTempUnit){
	
	//static location or default
	if (clientWorldLocation){
		clientWorldLocation = JSON.stringify(clientWorldLocation);
	}else{
		clientWorldLocation = ""; //JSON.stringify({ latitude: "52.52",	longitude: "13.37", city: "Berlin", country: "Germany" });
	}
	this.setClientWorldLocation = function(newLocation){
		clientWorldLocation = newLocation;
	}
	
	//device local site
	if (!deviceLocalSite) deviceLocalSite = {
		location: "",		//e.g.: "home", "mobile", empty
		type: "",			//e.g.: "room" (location=home), empty
		name: "unassigned",	//e.g.: "office" (type=room), "unassigned"
		index: "",			//e.g.: 1, 2, 212, ...
		updates: "off"		//e.g.: "off", "auto" (not supported yet)
	};
	this.setDeviceLocalSite = function(newSite){
		deviceLocalSite = newSite;
	}
	
	//units
	if (!prefTempUnit) prefTempUnit = "C"; 	//"F"	//note: could be given by 'user' as well
	this.setPrefTempUnit = function(newUnit){
		prefTempUnit = newUnit;
	}
	
	function getRequestBody(input){
		return {
			text: input.text,
			lang: (input.lang || user.getLanguage() || config.getAppLanguage()),
			time: new Date().getTime(),
			time_local: getLocalDateInSepiaFormat(),
			user_location: clientWorldLocation,
			custom_data: {
				prefTempUnit: prefTempUnit,
				deviceLocalSite: deviceLocalSite
			}
		};
	}
	this.getRequestBody = function(input){
		return getRequestBody(input);
	}
	
	this.interpret = function(input){
		var resultJsonPromise = callSepiaEndpoint(config, user, "assist", "interpret", getRequestBody(input));
		return resultJsonPromise;
	}
	this.understand = function(input){
		var resultJsonPromise = callSepiaEndpoint(config, user, "assist", "understand", getRequestBody(input));
		return resultJsonPromise;
	}
	this.interview = function(input){
		var resultJsonPromise = callSepiaEndpoint(config, user, "assist", "interview", getRequestBody(input));
		return resultJsonPromise;
	}
	this.answer = function(input){
		var resultJsonPromise = callSepiaEndpoint(config, user, "assist", "answer", getRequestBody(input));
		return resultJsonPromise;
	}
}

//---Helper functions:

//local date and time
function getLocalDateInSepiaFormat(){
	var d = new Date();
	var HH = addZero(d.getHours());
	var mm = addZero(d.getMinutes());
	var ss = addZero(d.getSeconds());
	var dd = addZero(d.getDate());
	var MM = addZero(d.getMonth() + 1);
	var yyyy = d.getFullYear();
	return '' + yyyy + '.' + MM + '.' + dd + '_' + HH + ':' + mm + ':' + ss;
}
function addZero(i) {
	return (i < 10)? "0" + i : i;
}

//---EXPORTS:

module.exports = { Assistant }
