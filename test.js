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
var user = new User(conf, "uid1007", "test12345");
console.log("LOG - User: " + user.userId);

//test API calls

(async function(){
	try {
		await user.authenticate();
		console.log("LOG - Result authentication:", user.getName(), user.getRoles());
	}catch (err){
		console.error("ERROR - Authentication:", err);
	}
	
	var pingRes;
	
	try {
		pingRes = await callSepiaEndpoint(conf, undefined, "assist", "ping");
		console.log("LOG - Ping Assist-Server:", pingRes);
	}catch (err){
		console.error("ERROR - Assist Ping:", err);
	}
	try {
		pingRes = await callSepiaEndpoint(conf, undefined, "teach", "ping");
		console.log("LOG - Ping Teach-Server:", pingRes);
	}catch (err){
		console.error("ERROR - Teach Ping:", err);
	}
	try {
		pingRes = await callSepiaEndpoint(conf, undefined, "chat", "ping");
		console.log("LOG - Ping Chat-Server:", pingRes);
	}catch (err){
		console.error("ERROR - Chat Ping:", err);
	}
	
	new Tts(conf, user).getInfo().then(function(res){
		console.log("LOG - TTS Info result:", res);
	}).catch(function(err){
		console.log("LOG - TTS Info ERROR:", err);
	});
})();
