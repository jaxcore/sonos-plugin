const Adapter = require('jaxcore-plugin').Adapter;

class SonosAdapter extends Adapter {
	static getDefaultState() {
		return {
		
		};
	}
	
	constructor(config, theme, devices, services) {
		super(config, theme, devices, services);
		const {spin} = devices;
		const {sonos} = services;
		spin.rotateRainbow(2);
		spin.lightsOff();
		
		this.addEvents(spin, {
			spin: function (diff, time) {
				this.log('spin', diff, time);
				sonos.changeVolume(diff);
			},
			button: function (pushed) {
				this.log('button', pushed);
			},
			buttonHold: function () {
			
			},
			knob: function (pushed) {
				this.log('knob', pushed);
				if (pushed) sonos.togglePlayPause();
			}
		});
		
		this.addEvents(sonos, {
			volume: function (volumePercent) {
				console.log('volume', volumePercent);
				if (sonos.state.muted) {
					spin.scale(volumePercent, theme.tertiary, theme.tertiary, theme.middle);
				} else {
					spin.scale(volumePercent, theme.low, theme.high, theme.middle);
				}
			},
			playing: function () {
				console.log('playing');
				spin.flash(theme.success);
			},
			paused: function (paused) {
				console.log('paused', paused);
				if (paused) spin.flash(theme.secondary);
				else spin.flash(theme.success);
			},
			navigate: function (type) {
				this.log('navigate', type);
			}
		});
	}
	
	static getServicesConfig(adapterConfig) {
		return {
			sonos: adapterConfig.settings.services.sonos
		};
	}
}

module.exports = SonosAdapter;

//
// spin.flash([0, 255, 0]);
//
// spin.on('disconnect', function() {
// 	console.log('spin disconnected');
// });
//
// sonos.on('volume', function(volumePercent, volume) {
// 	console.log('volume', volumePercent, volume);
// 	if (sonos.state.muted) {
// 		spin.dial(sonos.state.volumePercent, [100,100,0], [255, 255, 0], [255, 255, 0]);
// 	}
// 	else {
// 		spin.dial(volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
// 	}
// });
// sonos.on('muted', function(muted) {
// 	console.log('muted', muted);
// 	if (muted) {
// 		// spin.flash([255,255,0]);
// 		spin.dial(sonos.state.volumePercent, [100,100,0], [255, 255, 0], [255, 255, 0]);
// 	}
// 	else {
// 		spin.dial(sonos.state.volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
// 	}
// });
//
// spin.on('spin', function(direction) {
// 	console.log('spin', direction);
// 	if (direction === 1) {
// 		sonos.volumeUp();
// 	}
// 	else {
// 		sonos.volumeDown();
// 	}
// });
//
// spin.on('button', function(pushed) {
// 	console.log('button', pushed);
// 	if (pushed) {
// 		sonos.toggleMuted();
// 	}
// });
//
// spin.on('knob', function(pushed) {
// 	if (!pushed) {
// 		console.log('knob', pushed);
// 		sonos.togglePlayPause();
// 	}
// });