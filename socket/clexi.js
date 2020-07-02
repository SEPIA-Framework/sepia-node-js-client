const fetch = require('node-fetch');
const AbortController = require("abort-controller");
const { URLSearchParams } = require('url');
const WebSocket = require('isomorphic-ws');

/* CLEXI - Client Extension Interface */
function ClexiNodeJS(){
	
	var version = "0.8.2_n";
	this.getVersion = function(){
		return version;
	}
	
	this.serverId = "";		//if you set this the client will check the server ID on welcome event and close connection if not identical
	
	thisClexi = this;
	
	//Extension subscriptions
	var subscriptions = {};
	
	//Websocket connection
	var hostURL;
	var ws;
	var msgId = 0;

	var reconnectBaseDelay = 330;
	var reconnectMaxDelay = 300000;
	var reconnectTry = 0;
	var reconnectTimer = undefined;
	var requestedClose = false;
	var readyToAcceptEvents = false; 	//the welcome event will set this to true and allow subscriptions (if data is correct)
	
	var isConnected = false;
	this.isConnected = function(){
		return isConnected;
	}
	this.doAutoReconnect = true;
	this.setMaxReconnectDelay = function(delay){
		reconnectMaxDelay = delay;
	}
	
	this.onLog = undefined;		//set this in your code to get log messages
	this.onDebug = undefined;
	this.onError = undefined;
	
	this.availableXtensions = {}; 	//TODO: we should update this somehow (will only update once at welcome event)
	
	this.pingAndConnect = function(host, onPingOrIdError, onOpen, onClose, onError, onConnecting, onWelcome){
		var url;
		if (!host){
			if (thisClexi.onError) thisClexi.onError("CLEXI error: missing host address");
			return;
		}else{
			url = host.replace(/^wss/, 'https').replace(/^ws/, 'http');
		}
		thisClexi.httpRequest("GET", url + "/ping", function(data){
			//Success
			if (typeof data == "string" && data.indexOf("{") == 0){
				data = JSON.parse(data);
			}
			//console.log(data);
			//check ID
			if (data.id && (data.id == thisClexi.serverId || (data.id == "[SECRET]" && thisClexi.serverId))){
				thisClexi.connect(host, onOpen, onClose, onError, onConnecting, onWelcome);
			}else{
				if (thisClexi.onError) thisClexi.onError("CLEXI error: connection aborted due to wrong server ID");
				if (onPingOrIdError) onPingOrIdError({
					code: 418,
					msg: "CLEXI connection aborted due to wrong server ID."
				});
			}
		}, function(){
			//Error
			if (thisClexi.onError) thisClexi.onError("CLEXI error: connection failed! Server not reached");
			if (onPingOrIdError) onPingOrIdError({
				code: 404,
				msg: "CLEXI connection failed! Server not reached."
			});
		});
	}
	
	this.connect = function(host, onOpen, onClose, onError, onConnecting, onWelcome){
		//URL
		if (!host){
			if (thisClexi.onError) thisClexi.onError("CLEXI error: missing host address");
			return;
		}else{
			hostURL = host.replace(/^https/, 'wss').replace(/^http/, 'ws');
		}
		
		//Connect
		try {
			ws = new WebSocket(hostURL);
		}catch (err){
			if (thisClexi.onError){
				if (typeof err == "string"){
					thisClexi.onError("CLEXI error: " + err);
				}else if (err.message){
					thisClexi.onError("CLEXI error: " + err.message);
				}else{
					thisClexi.onError("CLEXI error");
				}
			}
			if (onError) onError(err);
			return;
		}
		requestedClose = false;
		readyToAcceptEvents = false;
		if (thisClexi.onLog) thisClexi.onLog('CLEXI connecting ...');
		if (onConnecting) onConnecting();
		
		//Events:
		
		ws.onopen = function(me){
			reconnectTry = 0;
			isConnected = true;
			if (reconnectTimer) clearTimeout(reconnectTimer);
			if (thisClexi.onLog) thisClexi.onLog('CLEXI connected');
			if (onOpen) onOpen(me);
			//send welcome
			thisClexi.send("welcome", {"client_version": thisClexi.getVersion(), "server_id": thisClexi.serverId});
		};
		
		ws.onmessage = function(me){
			//console.log(me);
			msg = JSON.parse(me.data);
			if (thisClexi.onDebug) thisClexi.onDebug('CLEXI received msg of type: ' + msg.type);
			
			//check xtensions first
			if (readyToAcceptEvents && subscriptions[msg.type]){
				if (msg.data){
					//Extension event
					subscriptions[msg.type].onEvent(msg.data);
				}else if (msg.response){
					//Extension response to input
					subscriptions[msg.type].onResponse(msg.response, msg.id);
				}else if (msg.error){
					//Extension error
					subscriptions[msg.type].onError(msg.error);
				}
			
			//was welcome message?
			}else if (msg.type == "welcome"){
				if (msg.info && msg.info.xtensions) thisClexi.availableXtensions = msg.info.xtensions;
				if (thisClexi.onLog) thisClexi.onLog('CLEXI server says welcome. Info: ' + JSON.stringify(msg.info));
				if (msg.code && msg.code == 401){
					//server requires correct ID for authentication - This is "the" security feature (see comment below)
					thisClexi.close();
				//check server ID
				}else if (thisClexi.serverId && msg.info.id && (thisClexi.serverId != msg.info.id)){
					//NOTE: the server might not necessarily refuse connections with wrong ID (depends on settings), but we will if ID is given.
					//Obviously this is NOT a security feature but a server ID filter ;-)
					thisClexi.close();
				}else{
					readyToAcceptEvents = true;
					if (onWelcome) onWelcome(msg.info);
				}
			}
		};
		
		ws.onerror = function(error){
			if (thisClexi.onError){
				if (typeof error == "string"){
					thisClexi.onError("CLEXI error: " + error);
				}else if (error.message){
					thisClexi.onError("CLEXI error: " + error.message);
				}else{
					thisClexi.onError("CLEXI error");
				}
			}
			if (onError) onError(error);
		};
		
		ws.onclose = function(me){
			isConnected = false;
			if (thisClexi.onLog) thisClexi.onLog('CLEXI closed. Reason: ' + me.code + " " + me.reason);
			if (onClose) onClose(me);
			//was requested close?
			if (!requestedClose){
				//try reconnect?
				if (thisClexi.doAutoReconnect){
					autoReconnect(host, onOpen, onClose, onError, onConnecting, onWelcome);
				}
			}else{
				if (reconnectTimer) clearTimeout(reconnectTimer);
				reconnectTry = 0;
			}
		};
	}
	
	this.close = function(){
		if (reconnectTimer) clearTimeout(reconnectTimer);
		requestedClose = true;
		if (ws && isConnected){
			ws.close();
		}
	}
	
	function autoReconnect(host, onOpen, onClose, onError, onConnecting, onWelcome){
		reconnectTry++;
		var delay = Math.min(reconnectTry*reconnectTry*reconnectBaseDelay, reconnectMaxDelay);
		//TODO: we could/should check navigator.onLine here ...
		if (reconnectTimer) clearTimeout(reconnectTimer);
		reconnectTimer = setTimeout(function(){
			if (!isConnected && !requestedClose){
				if (thisClexi.onLog) thisClexi.onLog('CLEXI reconnecting after unexpected close. Try: ' + reconnectTry);
				thisClexi.connect(host, onOpen, onClose, onError, onConnecting, onWelcome);
			}
		}, delay);
	}
	
	this.send = function(extensionName, data, numOfRetries){
		if (ws && isConnected){
			var msg = {
				type: extensionName,
				data: data,
				id: ++msgId,
				ts: Date.now()
			};
			// Send the msg object as a JSON-formatted string.
			ws.send(JSON.stringify(msg));
		}else if (numOfRetries && numOfRetries > 0){
			thisClexi.schedule(extensionName, data, 0, numOfRetries);
		}
	}
	this.schedule = function(extensionName, data, thisRetry, maxRetries){
		thisRetry++;
		if (thisRetry <= maxRetries){
			setTimeout(function(){
				if (ws && isConnected){
					thisClexi.send(extensionName, data, maxRetries - thisRetry);
				}else{
					thisClexi.schedule(extensionName, data, thisRetry, maxRetries);
				}
			}, thisClexi.scheduleDelay);
		}else{
			//Error: message not delivered - what TODO ?
			if (thisClexi.onError) thisClexi.onError('CLEXI send failed!');
		}
	}
	this.scheduleDelay = 1500;
	
	/**
	* Subscribe to an extension event. 
	* Note: currently you can have only one callback per extension. Feel free to
	* implement your own event dispatcher.
	*/
	this.subscribeTo = function(extensionName, eventCallback, inputCallback, errorCallback){
		subscriptions[extensionName] = {
			onEvent: eventCallback || function(){},
			onResponse: inputCallback || function(){},
			onError: errorCallback || function(){}
		};
	}
	this.removeSubscription = function(extensionName){
		delete subscriptions[extensionName];
	}
	
	function httpFetchRequest(method, url, data, headers, timeoutMs, successCallback, errorCallback, connectErrorCallback){
		const controller = new AbortController();
		const timeout = setTimeout(() => { controller.abort(); }, timeoutMs || 10000);
		
		var config = {
			method: method,
			signal: controller.signal
		}
		var acceptHeader;
		if (headers){
			config.headers = headers;
			acceptHeader = (headers['Accept'] || headers['accept']);
		}
		if (data){
			var contentType = headers? (headers['Content-Type'] || headers['content-type']) : "";
			var body;
			if (contentType && typeof data == "object"){
				//'application/x-www-form-urlencoded'
				if (contentType == 'application/x-www-form-urlencoded'){
					body = new URLSearchParams();
					Object.keys(data).forEach(function(key){
						body.append(key, data[key]);
					});
				//'application/json'
				}else if (contentType == 'application/json'){
					body = JSON.stringify(data);
				}
			}else{
				body = data;
			}
			config.body = body;
		}
		var f = fetch(url, config);
		f.then(function(res){
			clearTimeout(timeout);
			var prom;
			if (acceptHeader && acceptHeader.indexOf('text') == 0){
				//text
				prom = res.text();
			}else{
				//JSON
				prom = res.json();
			}
			prom.then(function(content){
				//GOOD
				if (successCallback) successCallback(content);
			}).catch(function(err){
				//FAIL
				if (errorCallback) errorCallback(err);
			})
		})
		//FAIL
		.catch(err => {
			clearTimeout(timeout);
			//return Promise.reject(err);
			if (err.name === 'AbortError'){
				err = new Error("request to " + url + " failed, reason: could not establish connection before timeout");
				//throw err;
				if (connectErrorCallback) connectErrorCallback(err);
				else if (errorCallback) errorCallback(err);
			}else{
				//throw new Error(err.message);
				if (errorCallback) errorCallback(err);
			}
		});
	}
	
	this.httpRequest = function(method, url, successCallback, errorCallback, connectErrorCallback){
		var data = undefined;
		var headers = undefined;
		var timeoutMs = 5000;
		httpFetchRequest(method, url, data, headers, timeoutMs, successCallback, errorCallback, connectErrorCallback);
	}

	this.sendHttpEvent = function(host, clexiId, eventName, data, successCallback, errorCallback, connectErrorCallback){
		var url = host.replace(/^wss/, 'https').replace(/^ws/, 'http').replace(/\/$/, '') + "/event/" + eventName;
		var headers = {
			"clexi-id": clexiId
		}
		var timeoutMs = 5000;
		httpFetchRequest("POST", url, data, headers, timeoutMs, successCallback, errorCallback, connectErrorCallback);
	}
}

module.exports = ClexiNodeJS;