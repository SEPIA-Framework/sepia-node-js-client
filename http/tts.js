const callSepiaEndpoint = require('../common/callEndpoint');

function Tts(config, user){
	
	this.getInfo = function(){
		var resultJsonPromise = callSepiaEndpoint(config, user, "assist", "tts-info");
		return resultJsonPromise;
	}
	
	this.getAudio = function(input){
		var resultJsonPromise = callSepiaEndpoint(config, user, "assist", "tts", {
			text: input.text,
			lang: (input.lang || user.getLanguage() || config.getAppLanguage()),
			voice: input.voice,
			gender: input.gender,
			mood: input.mood
		});
		
		return resultJsonPromise;
	}
}

module.exports = { Tts }
