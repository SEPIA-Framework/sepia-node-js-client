const { Config } = require('./common/config');
const { User } = require('./common/user');
const { Tts } = require('./http/tts');
const callSepiaEndpoint = require('./common/callEndpoint');

//create config
var serverHost = "192.168.178.20";
var deviceId = "n1"
var conf = new Config(serverHost, deviceId);

//create user
var preferredLanguageCode = "en";
var user = new User("uid1007", "test12345", preferredLanguageCode);

//test API calls

(async function(){
	var pingRes = await callSepiaEndpoint(conf, undefined, "assist", "ping");
	console.log("LOG - Ping Assist-Server:", pingRes);
	
	pingRes = await callSepiaEndpoint(conf, undefined, "teach", "ping");
	console.log("LOG - Ping Teach-Server:", pingRes);
	
	pingRes = await callSepiaEndpoint(conf, undefined, "chat", "ping");
	console.log("LOG - Ping Chat-Server:", pingRes);
	
	new Tts(conf, user).getInfo().then(function(res){
		console.log("LOG - TTS Info result:", res);
	});
})();
