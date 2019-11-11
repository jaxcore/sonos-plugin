const {Client, createStore, createLogger} = require('jaxcore-plugin');
const {Sonos} = require('sonos');
const sonosStore = createStore('Sonos Store');

let _instance = 0;

class SonosClient extends Client {
	constructor(serviceId, serviceConfig, device) {
		super();
		
		// this.id = serviceId;
		serviceConfig.id = serviceId;
		this.device = device;
		
		this.setStore(sonosStore);
		
		this.setStates({
			id: {
				type: 'string',
				defaultValue: ''
			},
			host: {
				type: 'string',
				defaultValue: ''
			},
			hostport: {
				type: 'number',
				defaultValue: 0
			},
			connected: {
				type: 'boolean',
				defaultValue: false
			},
			muted: {
				type: 'boolean',
				defaultValue: false
			},
			volume: {
				type: 'integer',
				defaultValue: 0,
				minimum: 'minVolume',
				maximum: 'maxVolume'
			},
			volumePercent: {
				type: 'float',
				defaultValue: 0
			},
			minVolume: {
				type: 'integer',
				defaultValue: 0,
				maximumValue: 100,
				minimumValue: 0
			},
			maxVolume: {
				type: 'integer',
				defaultValue: 100,
				maximumValue: 100,
				minimumValue: 0
			},
			volumeIncrement: {
				type: 'integer',
				defaultValue: 1
			},
			playing: {
				type: 'boolean',
				defaultValue: false
			},
			playlistId: {
				type: 'string'
			},
			paused: {
				type: 'boolean',
				defaultValue: false
			},
			position: {
				type: 'integer',
				defaultValue: 1
			},
			positionPercent: {
				type: 'float',
				defaultValue: 0
			},
			duration: {
				type: 'integer',
				defaultValue: 1
			}
		}, serviceConfig);
		
		this.id = this.state.id;
		
		this.log = createLogger('Sonos Client ' + (_instance++));
		this.log('create', serviceConfig);
		
		this.lastVolumeTime = null;
		
		this.once('teardown', () => {
			this.stopMonitor();
		});
	}
	
	connect() {
		this.log('connecting to', this.state.host);
		if (!this.device) this.device = new Sonos(this.state.host);
		
		this.getMuted(() => {
			console.log('GOT MUTE');
			this.getVolume(() => {
				console.log('GOT VOLUME');
				this.getPlayState(() => {
					console.log('GOT PLAYSTATE');
					this._connected();
				});
			});
		});
	}
	
	_connected() {
		this.startMonitor();
		this.setState({
			connected: true
		});
		this.log('connectED');
		this.emit('connect');
	}
	
	disconnect(options) {
		this.log('disconnecting...');
	}
	
	changeVolume(diff) {
		this.setVolume(this.state.volume + this.state.volumeIncrement * diff);
	}
	
	toggleMuted() {
		var muted = !this.state.muted;
		this.setMuted(muted);
	}
	
	_setVolume(v) {
		if (v === this.state.volume) {
			// this.emit('volume', this.state.volumePercent, this.state.volume);
		}
		else {
			var percent = (v - this.state.minVolume) / (this.state.maxVolume - this.state.minVolume);
			
			this.setState({
				volume: v,
				volumePercent: percent
			});
			this.device.setVolume(v);
			this.lastVolumeTime = new Date();
			this.emit('volume', percent, v);
		}
	}
	
	setVolume(v) {
		v = Math.round(v);
		if (v < this.state.minVolume) v = this.state.minVolume;
		if (v > this.state.maxVolume) v = this.state.maxVolume;
		if (v !== this.state.volume) {
			console.log('setVolume', v);
			this.lastVolumeTime = new Date();
			this._setVolume(v);
		}
		else {
			this.emit('volume', this.state.volumePercent, this.state.volume);
		}
	}
	
	setMinVolume(v) {
		this.setState({
			minVolume: v
		});
		if (this.state.volume < v) {
			console.log('below min');
			this.setVolume(v);
		}
	}
	
	setMaxVolume(v) {
		this.setState({
			maxVolume: v
		});
		if (this.state.volume > v) {
			console.log('above max');
			this.setVolume(v);
		}
	}
	
	_setMuted(muted) {
		if (this.state.muted !== muted) {
			this.log('_setMuted', muted);
			this.setState({
				muted: muted
			});
			this.emit('muted', muted);
		}
	}
	
	setMuted(muted) {
		console.log('setMuted', muted);
		this.device.setMuted(muted);
	}
	
	togglePlayPause() {
		this.device.togglePlayback();
	}
	
	getPlayState(callback) {
		var me = this;
		this.device.getCurrentState().then((currState) => {
			
			var playing, paused;
		
			if (currState === 'transitioning') {
				//??
			}
			
			if (currState === 'paused') {
				playing = true;
				paused = true;
			}
			else if (currState === 'playing') {
				playing = true;
				paused = false;
			}
			else {
				playing = false;
				paused = false;
			}
			
			// if (playing !== me.state.playing || paused !== me.state.paused) {
			// 	me.state.playing = playing;
			// 	me.state.paused = paused;
			// 	me.emit('playState', {
			// 		playing: me.state.playing,
			// 		paused: me.state.paused
			// 	});
			// }
			
			if (paused !== me.state.paused) {
				this.log('paused:', paused);
				this.setState({
					paused
				});
				me.emit('paused', paused);
			}
			
			// console.log(currState + ' ' + me.state.position + ' / ' + me.state.duration, {
			// 	playing: me.state.playing,
			// 	paused: me.state.paused
			// });
			
			
		});
		
		this.device.currentTrack().then((track) => {
			// console.log('currentTrack', track);
			/*
			 { title: 'One Very Important Thought',
			 artist: 'Boards Of Canada',
			 album: 'Music Has The Right To Children',
			 albumArtURI: 'http://192.168.0.160:3500/music/image?id=515897&flags=1',
			 position: 36,
			 duration: 79,
			 albumArtURL: 'http://192.168.0.160:3500/music/image?id=515897&flags=1',
			 uri: 'http://mobile-ACR-5e967ce961cf9aeb.x-udn/music/track.mp3?id=515897&flags=1' }
			 */
			if (track.position && track.duration) {
			}
			else {
				track.position = 0;
				track.duration = 0;
				track.positionPercent = 0;
			}
			
			if (track.position !== this.state.position ||
				track.duration !== this.state.duration) {
				
				let positionPercent = 0;
				if (track.position >= track.duration) positionPercent = 1;
				else if (track.position && track.duration) {
					positionPercent = track.position / track.duration;
					if (isNaN(positionPercent)) positionPercent = 0;
				}
				
				this.setState({
					position: track.position,
					duration: track.duration,
					positionPercent
				});
				console.log(this.state.positionPercent);
			}
			
			if (callback) callback(track.positionPercent);
		});
	}
	
	play() {
		var me = this;
		this.device.play(function () {
			me.state.playing = true;
			me.state.paused = false;
			me.emit('playState', {
				playing: me.state.playing,
				paused: me.state.paused
			});
		});
	}
	
	pause() {
		var me = this;
		this.device.pause(function () {
			me.state.playing = true;
			me.state.paused = true;
			me.emit('playState', {
				playing: me.state.playing,
				paused: me.state.paused
			});
		});
	}
	
	stop() {
		this.device.stop().then(() => {
			this.state.playing = false;
			this.state.paused = false;
			this.emit('playState', {
				playing: this.state.playing,
				paused: this.state.paused
			});
		});
	}
	
	next() {
		this.device.next(function () {
		});
	}
	
	previous() {
		this.device.previous().then(() => {
			this.log('send previous');
		});
	}
	
	seek(seconds) {
		console.log('sonos seek ' + seconds);
		this.device.seek(seconds).then((err) => {
			this.log('sent seek', seconds);
		});
	}
	
	getVolume(callback) {
		if (this.lastVolumeTime === null || (new Date().getTime() - this.lastVolumeTime.getTime() > 1000)) {
			this.device.getVolume().then((volume) => {
				// this.log(`getVolume = ${volume}`);
				this._setVolume(volume);
				callback();
			});
		}
	}
	
	getMuted(callback) {
		this.device.getMuted().then((muted) => {
			//this.log(`first getMuted = ${muted}`);
			this._setMuted(muted);
			callback();
		});
	}
	
	startMonitor() {
		clearInterval(this.monitor);
		var me = this;
		this.monitor = setInterval(function () {
			me.getVolume(function () {
			});
			me.getMuted(function () {
			});
			me.getPlayState(function () {
			});
		}, 500);
	}
	
	stopMonitor() {
		clearInterval(this.monitor);
	}
	
}

module.exports = SonosClient;