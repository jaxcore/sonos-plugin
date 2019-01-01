var io = require('./lib/io');

var devices = {
	inputs: [{
		device: 'jaxcore-spin-server'
	}],
	player: {
		device: 'sonos',
		settings: {
			maxVolume:70
			// serialNum: '5C-AA-FD-E0-9E-A8:4'
			// if no serialNum defined, it will return the first Sonos device found
		}
	}
};

function startSonos(config, callback) {
	var sonos = io.createDevice(config);
	
	sonos.on('connect', function (id) {
		
		console.log('connected to '+id, sonos.state);
		
		if (callback) callback(sonos);
		
	});
	
	sonos.on('muted', function (muted) {
		console.log('on muted:', muted);
	});
	
	sonos.on('volume', function (volume, percent) {
		console.log('on volume:', volume, percent);
	});
	
	sonos.on('play', function () {
		console.log('on play');
	});
	
	sonos.on('pause', function () {
		console.log('on play');
	});
	
	sonos.connect();
}

function startSpin(config, callback) {
	var spinServer = io.createDevice(config);
	
	spinServer.on('connect', function () {
		console.log('Ready to SPIN (server).');
		
		if (callback) callback(spinServer);
	});
	
	
	spinServer.on('spin-connected', function () {
		console.log('spin-connected');
	});
	
	spinServer.on('spin-disconnected', function (number, direction, position, time) {
		console.log('spin disconnected', number, direction, position, time);
	});
	
	spinServer.connect();
	
}

startSonos(devices.player, function(player) {
	
	var spinConfig = devices.inputs[0];
	
	startSpin(spinConfig, function (spinServer) {
		
		var lastVolumeTime = new Date().getTime();
		
		player.on('volume', function(scalar, volume) {
			if (new Date().getTime() - lastVolumeTime > 1000) {
				spinServer.broadcastScalar(scalar);
			}
		});
		
		var buttons = [false, false];
		var cancelRelease = [false, false];
		var skipVolume = [0, 0];
		var skipSeek = [0, 0];
		
		var isSeeking = false;
		var seekPosition = null;
		var seekToNext = false;  // boolean flag to play next song when seeking to end of song
		var seekToStart = false;  // boolean flag to play previous song when seeking too far in reverse
		
		//var seekToPreviousThreshhold = 0;
		
		spinServer.on('spin', function (spinState, direction, position, time) {
			console.log('spin', direction, position, time);
			
			// if (buttons[0] === true) {
			// 	console.log('PUSH 0 do nothing');
			// 	//player.seek(direction * 10);
			// 	cancelRelease[0] = false;
			//
			// }
			if (buttons[1] === true) {
				// seek mode
				
				//cancelRelease[1] = true;
				
				if (player.state.playerActive && !player.state.paused) {
					if (!isSeeking) {
						isSeeking = true;
						seekToNext = false;
						seekToStart = false;
						seekPosition = player.state.position;
					}
					
					seekPosition += direction * 3;
					
					if (seekPosition <= 0) {
						seekPosition = 0;
						seekToStart = true;
					}
					else {
						seekToStart = false;
					}
					
					if (seekPosition > player.state.duration) {
						seekPosition = player.state.duration;
						seekToNext = true;
					}
					else {
						seekToNext = false;
					}
					
					console.log('seeking... seekPosition = '+seekPosition);
					
					var positionPercent = seekPosition / player.state.duration;
					spinServer.broadcastScalar(positionPercent, 1); // mode 1 = seek
					
				}
				else {
					console.log('NOT SEEKING, NOT PLAYING?');
				}
				// if (direction === 1) {
				//
				//
				// }
				// if (direction === -1) {
				//
				// }
			}
			else {
				if (direction === 1) {
					lastVolumeTime = new Date().getTime();
					player.volumeUp();
					
					spinServer.broadcastScalar(player.state.volumePercent); // mode 0 = volume
				}
				if (direction === -1) {
					lastVolumeTime = new Date().getTime();
					player.volumeDown();
					
					spinServer.broadcastScalar(player.state.volumePercent);
				}
			}
			
		});
		
		spinServer.on('push', function (device, number, buttonState, pushTime, releaseTime) {
			console.log('on push', number, buttonState, pushTime);
			
			buttons[number] = buttonState;
			
			if (buttonState === false && cancelRelease[number]) {
				cancelRelease[number] = false;
				console.log('cancelled release of button '+number);
				return;
			}
			
			if (number === 0 && buttonState === true) {
				player.togglePaused();
			}
			
			if (number === 1 && buttonState === false) {
				
				if (isSeeking) {
					
					console.log('was seeking....');
					if (seekToNext) {
						console.log('seekToNext');
						player.next();
					}
					if (seekToStart) {
						console.log('seekToStart');
						player.seek(0);
					}
					else {
						console.log('go to '+seekPosition);
						player.seek(seekPosition);
					}
					
					isSeeking = false;
				}
				else {
					player.next();
				}
			}
		});
	});
	
});

process.on('uncaughtException', function (err) {
	console.error(err);
	console.log("Node NOT Exiting...");
});