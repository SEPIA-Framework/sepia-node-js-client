const ClexiNodeJS = require('./socket/clexi');

//host
var clexiUrl = "ws://192.168.178.120:9090/clexi";
console.log("LOG - Clexi URL: " + clexiUrl);

//test connection

var clexi = new ClexiNodeJS();
clexi.serverId = ''; //'clexi-123';
  
clexi.subscribeTo("clexi-broadcaster", function(e){
	console.log("CLEXI broadcast event:", JSON.stringify(e));
}, function(e){
	console.log("CLEXI broadcast response:", JSON.stringify(e));
}, function(e){
	console.log("CLEXI broadcast error:", JSON.stringify(e));
});
  
clexi.pingAndConnect(clexiUrl, function(err){
	console.log('error', 'msg: ' + err.msg);
	
}, function(e){
	console.log('connected');

}, function(e){
	console.log('closed', 'reason: ' + e.reason, 'code: ' + e.code);

}, function(err){
	console.log('error', 'msg: ' + err.message);
	//console.error(err);
	
}, function(){
	console.log('connecting');

}, function(welcomeInfo){
	console.log('welcome', welcomeInfo);
	
	//test message
	clexi.send("clexi-broadcaster", {
		msg: "Hello world"
	});
});

