var Spin = require('jaxcore-spin');
var SonosService = require('./service');

SonosService.connect(function(sonos) {
	console.log('Sonos connected', sonos.host);
	
	// sonos.setMinVolume(10);
	// sonos.setMaxVolume(80);
	
	Spin.connectBLE(function(spin) {
		console.log('connected spin', spin.id, spin.state);
		
		spin.flash([0, 255, 0]);
		
		spin.on('disconnect', function() {
			console.log('spin disconnected');
		});
		
		sonos.on('volume', function(volumePercent, volume) {
			console.log('volume', volumePercent, volume);
			if (sonos.state.muted) {
				spin.dial(sonos.state.volumePercent, [100,100,0], [255, 255, 0], [255, 255, 0]);
			}
			else {
				spin.dial(volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
			}
		});
		sonos.on('muted', function(muted) {
			console.log('muted', muted);
			if (muted) {
				// spin.flash([255,255,0]);
				spin.dial(sonos.state.volumePercent, [100,100,0], [255, 255, 0], [255, 255, 0]);
			}
			else {
				spin.dial(sonos.state.volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
			}
		});
		
		spin.on('spin', function(direction) {
			console.log('spin', direction);
			if (direction === 1) {
				sonos.volumeUp();
			}
			else {
				sonos.volumeDown();
			}
		});
		
		spin.on('button', function(pushed) {
			console.log('button', pushed);
			if (pushed) {
				sonos.toggleMuted();
			}
		});
		
		spin.on('knob', function(pushed) {
			if (!pushed) {
				console.log('knob', pushed);
				sonos.togglePlayPause();
			}
		});
		
	});
	
});

