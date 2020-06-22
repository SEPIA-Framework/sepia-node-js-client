const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

//Endpoint configurations
const endpointConfigs = {
	"default": {
		method: postJson
	},
	"GET-PLAIN": {
		method: getPlain,
		responseType: "text",
		skipCredentials: true,
		skipClientInfo: true
	},
	"ping": {
		method: getJson,
		skipCredentials: true,
		skipClientInfo: true
	},
	"tts": {
		method: postForm
	},
	"tts-info": {
		method: postForm
	}
}

function log(msg, data){
	//console.log("LOG - " + msg, data);
}

//Call
function callEndpoint(config, user, serverNameOrUrl, endpoint, data){
	var conf = (!endpoint)? endpointConfigs["GET-PLAIN"] : (endpointConfigs[endpoint] || endpointConfigs["default"]);
	var httpReq = conf.method;
	var headers = conf.headers || {};
	
	//get correct server
	var url = config.getServer(serverNameOrUrl);
	if (endpoint){
		url += endpoint;
	}
	
	//add client and auth. data
	if (!data) data = {};
	if (!conf.skipClientInfo){
		data = Object.assign(config.getClientJson(), data);
	}
	if (!conf.skipCredentials){
		data = Object.assign(user.getAuthJson(), data);
	}
	
	log("callEndpoint url", url);				//DEBUG
	log("callEndpoint headers", headers);		//DEBUG
	
	var resProm = httpReq(url, data, headers);
	if (!conf.responseType || conf.responseType == "json"){
		return resProm.then(res => res.json());
	}else if (conf.responseType == "text"){
		return resProm.then(res => res.text());
	}
}
function postJson(url, data, headers){
	headers['Content-Type'] = 'application/json';
	var body = {};
	if (data){
		body = JSON.stringify(data);
		log("postJson body", body);				//DEBUG
	}
	return fetch(url, {
        method: 'POST',
        body:    body,
        headers: headers
    });
}
function postForm(url, data, headers){
	headers['Content-Type'] = 'application/x-www-form-urlencoded';
	const params = new URLSearchParams();
	if (data){
		Object.keys(data).forEach(function(key){
			params.append(key, data[key]);
		});
	}
	log("postForm params", params);				//DEBUG
	return fetch(url, { 
		method: 'POST', 
		body: 	 params,
		headers: headers
	});
}
function getPlain(url, data, headers){
	headers['Accept'] = 'text/plain';
	return fetch(url, { 
		method: 'GET',
		headers: headers
	});
}
function getJson(url, data, headers){
	headers['Accept'] = 'application/json';
	return fetch(url, { 
		method: 'GET',
		headers: headers
	});
}

//---EXPORTS:

module.exports = callEndpoint;
