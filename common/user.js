const crypto = require('crypto');
const callSepiaEndpoint = require('./callEndpoint');

function User(clientConfig, userId, pwd){
	this.userId = userId;
	var token;
	var tokenTS;
	var email;
	var name;
	var roles;
	var accessLevel;
	var prefLanguageCode;
	var isAuthenticated = false;
	
	if (pwd.length < 60){
		token = getSHA256(pwd);	//note: hashed clear-text! Trade this for "real" token.
	}else{
		token = pwd;
	}
	
	var thisUser = this;
		
	this.getKey = function(){
		if (isAuthenticated){
			return (thisUser.userId + ";" + token);
		}else{
			return;
		}
	}
	this.setToken = function(newToken){
		token = newToken;
	}
	this.getAuthJson = function(){
		if (isAuthenticated){
			return {
				KEY: thisUser.getKey()
			}
		}else{
			return;
		}
	}
	
	this.authenticate = function(successCallback, errorCallback){
		var resultJsonPromise = callSepiaEndpoint(clientConfig, undefined, "assist", "authentication", {
			action: "validate",
			KEY: (thisUser.userId + ";" + token)
		});
		return resultJsonPromise.then(function(json){
			if (json && json.keyToken){
				//success
				token = json.keyToken;
				tokenTS = json.keyToken_TS;
				email = json.email;
				roles = json.user_roles;
				name = json.user_name;
				accessLevel = json.access_level;
				prefLanguageCode = json.user_lang_code;
				isAuthenticated = true;
				if (successCallback) successCallback({
					userId: userId,
					accessLevel: accessLevel,
					name: name,
					roles: roles,
					email: email,
					prefLanguageCode: prefLanguageCode
				});
			}else{
				//error
				if (errorCallback) errorCallback(json);
			}
		}).catch(function(err){
			//error
			if (errorCallback) errorCallback(err);
		});
	}
	
	this.isAuthenticated = function(){
		return isAuthenticated;
	}
	
	this.getLanguage = function(){
		return prefLanguageCode;
	}
	this.getName = function(){
		return name;
	}
	this.getRoles = function(){
		return roles;
	}
	this.getEmail = function(){
		return email;
	}
}

//---Helper functions:

//sha256 hash + salt
function getSHA256(data){
	return crypto.createHash('sha256').update(data + "salty1").digest('hex');
}

//---EXPORTS:

module.exports = { User }
