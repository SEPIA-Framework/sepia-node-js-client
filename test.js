const { Config } = require('./common/config');
const { User } = require('./common/user');
const { Assistant } = require('./abilities/assistant');
const { RemoteAction } = require('./abilities/remote-action');
const { Tts } = require('./abilities/tts');
const callSepiaEndpoint = require('./http/callEndpoint');

//create config
var serverHost = "192.168.178.20";
var deviceId = "n1"
var conf = new Config(serverHost, deviceId);
console.log("LOG - Client host: " + serverHost + " - deviceId: " + deviceId);

//create user
var preferredLanguageCode = "en";
var user = new User(conf, "uid1007", "test12345");

//test API calls

(async function(){
	//Ping server
	var pingRes;
	var reachedAssistServer;
	
	try {
		pingRes = await callSepiaEndpoint(conf, undefined, "assist", "ping");
		console.log("LOG - Ping Assist-Server:", pingRes);
		reachedAssistServer = true;
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
	
	if (!reachedAssistServer){
		console.error("ERROR - Skipped user authentication");
		console.error("ERROR - Skipped assistant request");
		console.error("ERROR - Skipped remote action");
		console.error("ERROR - Skipped TTS test");
	}else{
		//User authentication
		try {
			console.log("LOG - User: " + user.userId);
			await user.authenticate();
			console.log("LOG - Result authentication:", user.getName(), user.getRoles());
		}catch (err){
			console.error("ERROR - Authentication:", err);
		}
		
		//Assistant interaction
		try {
			var assistant = new Assistant(conf, user);
			var assistantRes = await assistant.answer({
				text: "Hello"
			});
			console.log("LOG - Assistant response:", assistantRes.answer);
			
		}catch (err){
			console.error("ERROR - Assistant request:", err);
		}
		
		//Remote action
		try {
			var remoteAction = new RemoteAction(conf, user);
			var raResult = await remoteAction.triggerKey("F4");
			console.log("LOG - RemoteAction result:", raResult);
			
		}catch (err){
			console.error("ERROR - RemoteAction result:", err);
		}
		
		//TTS tests - NOTE: use as final call to test "normal" promise behaviour
		new Tts(conf, user).getInfo().then(function(res){
			console.log("LOG - TTS Info result:", res);
		}).catch(function(err){
			console.log("LOG - TTS Info ERROR:", err);
		});
	}
})();
