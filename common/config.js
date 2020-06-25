const version = "0.2.0";

//Server URLs
const serverDefaultPorts = {
	assist: "20721",
	teach: "20722",
	chat: "20723"
}
const proxyPort = "20726";

function Config(serverHost, deviceId, clientInfo, environment, appLanguage){
	this.clientInfo = clientInfo || "node_red";
	this.deviceId = deviceId || "n1";
	this.environment = environment || "";
	this.lang = appLanguage || "en";
	
	this.serverHost = serverHost || "http://localhost";
	//auto-detect correct URL
	if (this.serverHost.indexOf("http") != 0){
		this.serverHost = "http://" + this.serverHost;
	}
	var isProxyUrl = endsWith(this.serverHost, "/sepia/") || endsWith(this.serverHost, "/sepia");
	if (isProxyUrl && !endsWith(this.serverHost, "/")){
		this.serverHost += "/";
	}
	
	var thisConfig = this;
	
	this.getServer = function(serverNameOrUrl){
		var port = serverDefaultPorts[serverNameOrUrl];
		var url;
		if (!port){
			url = serverNameOrUrl;
		}else if (port && !isProxyUrl){
			url = thisConfig.serverHost + ":" + port;
		}else{
			url = thisConfig.serverHost + serverNameOrUrl;
		}
		if (!endsWith(url, "/")){
			url += "/";
		}
		return url;
	}
	
	this.getClientDeviceInfo = function(){
		return (thisConfig.deviceId.toLowerCase() + "_" + thisConfig.clientInfo + "_v" + version);
	}
	
	this.getClientJson = function(){
		return {
			client: thisConfig.getClientDeviceInfo(),
			device_id: thisConfig.deviceId,
			env: thisConfig.environment
		}
	}
	
	this.getAppLanguage = function(){
		return thisConfig.lang;
	}
}

//---Helper functions:

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

//---EXPORTS:

module.exports = { Config }
