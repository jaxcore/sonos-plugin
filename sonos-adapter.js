const {Adapter} = require('jaxcore');

class SonosAdapter extends Adapter {
	static getDefaultState() {
		return {
			didButtonHold: false,
			didButtonSpin: false,
			spinPosition: 0
		};
	}
	
	constructor(store, config, theme, devices, services) {
		super(store, config, theme, devices, services);
		const {spin} = devices;
		const {sonos} = services;
		spin.rainbow(2);
		spin.lightsOff();
		
		this.addEvents(spin, {
			spin: function (diff, time) {
				this.log('spin', diff, time);
				if (sonos.state.paused)  {
					spin.flash(theme.secondary);
				}
				else {
					if (spin.state.buttonPushed) {
						// seek
						this.state.didButtonSpin = true;
						
						//diff = spin.buffer(diff, 1, 1);
						this.showSeek(spin.state.spinPosition);
					}
					else if (spin.state.knobPushed) {
						// next / previous
					}
					else {
						if (sonos.state.muted)  {
							this.showVolume();
						}
						else {
							diff = spin.buffer(diff, 0, 0);
							if (diff !== 0) sonos.changeVolume(diff);
							console.log(sonos.state);
						}
					}
				}
			},
			button: function (pushed) {
				this.log('button', pushed);
				if (pushed) {
					this.state.didButtonHold = false;
					this.state.didButtonSpin = false;
					
					this.state.seekSpinPosition = spin.state.spinPosition;
					this.state.seekPlayPosition = sonos.state.positionPercent;
					
				}
				else {
					if (this.state.didButtonSpin) {
						this.doSeek(spin.state.spinPosition);
					}
					else if (!this.state.didButtonHold) {
						if (sonos.state.muted && sonos.state.paused) {
							sonos.setMuted(false);
						}
						if (sonos.state.paused) spin.flash(theme.success);
						else spin.flash(theme.secondary);
						sonos.togglePlayPause();
					}
				}
			},
			buttonHold: function () {
				if (!this.state.didButtonSpin) {
					this.log('button hold');
					sonos.next();
					spin.flash(theme.success);
					this.state.didButtonHold = true;
				}
			},
			knob: function (pushed) {
				this.log('knob', pushed);
				if (!pushed) {
					if (!sonos.state.paused)  {
						sonos.toggleMuted();
					}
				}
			}
		});
		
		this.addEvents(sonos, {
			volume: function (volumePercent) {
				console.log('volume', volumePercent);
				this.showVolume();
			},
			// playing: function () {
			// 	console.log('playing');
			// 	spin.flash(theme.success);
			// },
			paused: function (paused) {
				console.log('paused', paused);
				// if (paused) spin.flash(theme.secondary);
				// else spin.flash(theme.success);
			},
			muted: function(muted) {
				console.log('muted', muted);
				this.showVolume();
			}
		});
	}
	
	doSeek(spinPosition) {
		const {sonos} = this.services;
		const {spin} = this.devices;
		const {theme} = this;
		let posDiff = (spinPosition - this.state.seekSpinPosition);
		let startIndex = Math.round(this.state.seekPlayPosition*25);
		startIndex += posDiff;
		if (startIndex>25) {
			
			startIndex = 25;
		}
		if (startIndex<0) startIndex = 0;
		let p = startIndex/25;
		let seconds = sonos.state.duration * p;
		// console.log('ssek to',p);
		spin.dial(p, theme.success, theme.black, theme.middle);
		sonos.seek(seconds);
		
		spin.delay(500);
	}
	
	showSeek(spinPosition) {
		
		// TODO: show seek skip to previous
		
		const {spin} = this.devices;
		const {theme} = this;
		
		let posDiff = (spinPosition - this.state.seekSpinPosition);
		console.log('posDiff', posDiff, 'half', Math.floor(posDiff/2));
		
		let startIndex = Math.round(this.state.seekPlayPosition*25);
		// console.log('posDiff', posDiff, spinPosition, this.state.seekPosition, 'startIndex', startIndex);
		
		startIndex += posDiff;
		if (startIndex>25) {
			console.log('startIndex>25', startIndex);
			startIndex = 25;
		}
		if (startIndex<0) startIndex = 0;
		
		let p = startIndex/25;
		console.log('startIndex', startIndex, 'p', p);
		spin.dial(p, theme.primary, theme.black, theme.middle);
	}
	
	showVolume() {
		const {sonos} = this.services;
		const {spin} = this.devices;
		const theme = this.theme;
		if (sonos.state.muted) {
			spin.scale(sonos.state.volumePercent, theme.tertiary, theme.tertiary, theme.middle);
		} else {
			spin.scale(sonos.state.volumePercent, theme.low, theme.high, theme.middle);
		}
	}
	
	static getServicesConfig(adapterConfig) {
		return {
			sonos: adapterConfig.settings.services.sonos
		};
	}
}

module.exports = SonosAdapter;
