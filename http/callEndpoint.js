const fetch = require('node-fetch');
const AbortController = require("abort-controller")
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
		skipClientInfo: true,
		timeoutMs: 3000
	},
	"authentication": {
		method: postJson,
		skipCredentials: true	//its in "data" for this one
	},
	"interpret": {
		method: postForm
	},
	"understand": {
		method: postForm
	},
	"interview": {
		method: postForm
	},
	"answer": {
		method: postForm
	},
	"remote-action": {
		method: postForm
	},
	"tts": {
		method: postForm
	},
	"tts-info": {
		method: postForm
	}
}
const defaultTimeoutMs = 10000;		//nothing in SEPIA should take longer!

function log(msg, data){
	//console.log("LOG - " + msg, data);
}

//Call
function callEndpoint(config, user, serverNameOrUrl, endpoint, data){
	var conf = (!endpoint)? endpointConfigs["GET-PLAIN"] : (endpointConfigs[endpoint] || endpointConfigs["default"]);
	var httpReq = conf.method;
	var headers = conf.headers || {};
	var timeoutMs = conf.timeoutMs || defaultTimeoutMs;
	
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
		var authData = user.getAuthJson();
		if (!authData){
			return Promise.reject(new Error('missing authentication data'));
		}else{
			data = Object.assign(authData, data);
		}
	}
	
	log("callEndpoint url", url);				//DEBUG
	log("callEndpoint data", data);				//DEBUG
	log("callEndpoint headers", headers);		//DEBUG
	
	var resProm = httpReq(url, data, headers, timeoutMs);
	if (!conf.responseType || conf.responseType == "json"){
		return resProm
			.then(res => {
				if (resProm.reqTimeout){
					clearTimeout(resProm.reqTimeout);
					delete resProm.reqTimeout;
				}
				return res.json();
			})
			.catch(err => {
				if (resProm.reqTimeout){
					clearTimeout(resProm.reqTimeout);
					delete resProm.reqTimeout;
				}
				//return Promise.reject(err);
				if (err.name === 'AbortError'){
					throw new Error("request to " + url + " failed, reason: could not establish connection before timeout");
				}else{
					throw new Error(err.message);
				}
			});
	}else if (conf.responseType == "text"){
		return resProm
			.then(res => {
				if (resProm.reqTimeout){
					clearTimeout(resProm.reqTimeout);
					delete resProm.reqTimeout;
				}
				return res.text();
			})
			.catch(err => {
				if (resProm.reqTimeout){
					clearTimeout(resProm.reqTimeout);
					delete resProm.reqTimeout;
				}
				if (err.name === 'AbortError'){
					throw new Error("request to " + url + " failed, reason: could not establish connection before timeout");
				}else{
					throw new Error(err.message);
				}
			});
	}
}
function postJson(url, data, headers, timeoutMs){
	const controller = new AbortController();
	const timeout = setTimeout(() => { controller.abort(); }, timeoutMs || defaultTimeoutMs);
	
	headers['Content-Type'] = 'application/json';
	
	var body = {};
	if (data){
		body = JSON.stringify(data);
		log("postJson body", body);				//DEBUG
	}
	var f = fetch(url, {
        method: 'POST',
        body:    body,
        headers: headers,
		signal: controller.signal
    });
	f.reqTimeout = timeout;
	return f;
}
function postForm(url, data, headers, timeoutMs){
	const controller = new AbortController();
	const timeout = setTimeout(() => { controller.abort(); }, timeoutMs || defaultTimeoutMs);
	
	headers['Content-Type'] = 'application/x-www-form-urlencoded';
	
	const params = new URLSearchParams();
	if (data){
		Object.keys(data).forEach(function(key){
			params.append(key, data[key]);
		});
	}
	log("postForm params", params);				//DEBUG
	var f = fetch(url, { 
		method: 'POST', 
		body: 	 params,
		headers: headers,
		signal: controller.signal
	});
	f.reqTimeout = timeout;
	return f;
}
function getPlain(url, data, headers, timeoutMs){
	const controller = new AbortController();
	const timeout = setTimeout(() => { controller.abort(); }, timeoutMs || defaultTimeoutMs);
	
	headers['Accept'] = 'text/plain';
	
	var f = fetch(url, { 
		method: 'GET',
		headers: headers,
		signal: controller.signal
	});
	f.reqTimeout = timeout;
	return f;
}
function getJson(url, data, headers, timeoutMs){
	const controller = new AbortController();
	const timeout = setTimeout(() => { controller.abort(); }, timeoutMs || defaultTimeoutMs);
	
	headers['Accept'] = 'application/json';
	
	var f = fetch(url, { 
		method: 'GET',
		headers: headers,
		signal: controller.signal
	});
	f.reqTimeout = timeout;
	return f;
}

//---EXPORTS:

module.exports = callEndpoint;
