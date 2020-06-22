const crypto = require('crypto');

function User(userId, pwd, prefLanguageCode){
	this.userId = userId;
	if (pwd.length < 60){
		this.token = getSHA256(pwd);	//note: hashed clear-text! Trade this for "real" token.
	}else{
		this.token = pwd;
	}
	this.lang = prefLanguageCode;
	
	var thisUser = this;
		
	this.getKey = function(){
		return (thisUser.userId + ";" + thisUser.token);
	}
	this.setToken = function(newToken){
		thisUser.token = newToken;
	}
	
	this.getAuthJson = function(){
		return {
			KEY: thisUser.getKey()
		}
	}
	
	this.getLanguage = function(){
		return thisUser.lang;
	}
}

//---Helper functions:

//sha256 hash + salt
function getSHA256(data){
	return crypto.createHash('sha256').update(data + "salty1").digest('hex');
}

//---EXPORTS:

module.exports = { User }
