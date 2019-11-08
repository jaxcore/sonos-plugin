var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var sonosStore = plugin.createStore('Sonos Store');
const { Sonos } = require('sonos');

var _instance = 0;

function SonosClient(config, device) {
	this.constructor();
	if (device) {
		config.id = device.host;
		config.host = device.host;
	}
	else {
		config.id = config.host;
	}
	this.id = config.id;
	
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
	}, config);
	
	this.log = plugin.createLogger('Sonos Client '+(_instance++));
	this.log('create', config);
	
	if (device) {
		this.device = device;
	}
	
	this.lastVolumeTime = null;
}

SonosClient.prototype = new Client();
SonosClient.prototype.constructor = Client;

SonosClient.prototype.connect = function() {
	this.log('connecting to', this.state.host);
	
	if (!this.device) this.device = new Sonos(this.state.host);
	
	//this.device.play().then(() => console.log('now playing'));
	var me = this;
	
	this.getMuted(() => {
		this.getVolume(() => {
			this.getPlayState(() => {
				this.startMonitor();
				this.emit('connect');
			});
		});
	});
	
	this.lastVolumeTime = null;
	
	this.device.on('Volume', function(v) {
		console.log('on volume', v);
		if (me.lastVolumeTime === null || (new Date().getTime() - me.lastVolumeTime.getTime() > 1000)) {
			me._setVolume(v);
		}
	});
	this.device.on('Muted', function(m) {
		console.log('on Muted', m);
		me._setMuted(m);
	});
	this.device.on('PlayState', function(state) {
		console.log('on PlayState', state);
	});
	this.device.on('PlaybackStopped', function(state) {
		console.log('on PlaybackStopped', state);
	});
};

SonosClient.prototype.disconnect = function(options) {
	this.log('disconnecting...');
};

SonosClient.prototype.volumeUp = function () {
	var v = this.state.volume + this.state.volumeIncrement;
	console.log('volumeUp', v);
	this.setVolume(v);
};
SonosClient.prototype.volumeDown = function () {
	var v = this.state.volume - this.state.volumeIncrement;
	console.log('volumeDown', v);
	this.setVolume(v);
};
SonosClient.prototype.toggleMuted = function () {
	var muted = !this.state.muted;
	this.setMuted(muted);
};
SonosClient.prototype._setVolume = function (v) {
	var percent = v / 100;
	this.setState({
		volume: v,
		volumePercent: percent
	});
	this.device.setVolume(v);
	this.lastVolumeTime = new Date();
	this.emit('volume', percent, v);
};
SonosClient.prototype.setVolume = function (v) {
	v = Math.round(v);
	if (v<this.state.minVolume) v = this.state.minVolume;
	if (v>this.state.maxVolume) v = this.state.maxVolume;
	if (v !== this.state.volume) {
		console.log('setVolume', v);
		this.lastVolumeTime = new Date();
		this._setVolume(v);
	}
	else {
		this.emit('volume', this.state.volumePercent, this.state.volume);
	}
};
SonosClient.prototype.setMinVolume = function (v) {
	this.setState({
		minVolume: v
	});
	if (this.state.volume < v) {
		console.log('below min');
		this.setVolume(v);
	}
};
SonosClient.prototype.setMaxVolume = function (v) {
	this.setState({
		maxVolume: v
	});
	if (this.state.volume > v) {
		console.log('above max');
		this.setVolume(v);
	}
};
SonosClient.prototype._setMuted = function (muted) {
	this.setState({
		muted: muted
	});
	this.emit('muted', muted);
};
SonosClient.prototype.setMuted = function (muted) {
	console.log('setMuted', muted);
	this.device.setMuted(muted);
};
SonosClient.prototype.togglePlayPause = function () {
	this.device.togglePlayback();
};

SonosClient.prototype.getPlayState = function (callback) {
	var me = this;
	this.device.getCurrentState().then(function(currState) {
		
		console.log(currState + ' ' + me.state.position + ' / ' + me.state.duration);
		
		var playerActive, paused;
		
		if (currState === 'paused' || currState === 'transitioning') {
			playerActive = true;
			paused = true;
		} else if (currState === 'playing') {
			playerActive = true;
			paused = false;
		} else {
			playerActive = false;
			paused = false;
		}
		
		if (playerActive !== me.state.paused || paused !== me.state.paused) {
			me.state.playerActive = playerActive;
			me.state.paused = paused;
			me.emit('playState', {
				playerActive: me.state.playerActive,
				paused: me.state.paused
			});
		}
	});
	
	this.device.currentTrack().then(function(track) {
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
			this.setState({
				position: track.position,
				duration: track.duration,
				positionPercent: track.position / track.duration
			});
		}
		//if (callback) callback();
	});
};

SonosClient.prototype.play = function () {
	var me = this;
	this.device.play(function() {
		me.state.playerActive = true;
		me.state.paused = false;
		me.emit('playState', {
			playerActive: me.state.playerActive,
			paused: me.state.paused
		});
	});
};
SonosClient.prototype.pause = function () {
	var me = this;
	this.device.pause(function() {
		me.state.playerActive = true;
		me.state.paused = true;
		me.emit('playState', {
			playerActive: me.state.playerActive,
			paused: me.state.paused
		});
	});
};
SonosClient.prototype.stop = function () {
	var me = this;
	this.device.stop().then(function() {
		me.state.playerActive = false;
		me.state.paused = false;
		me.emit('playState', {
			playerActive: me.state.playerActive,
			paused: me.state.paused
		});
	});
};

SonosClient.prototype.next = function () {
	this.device.next(function() {
	});
};

SonosClient.prototype.previous = function () {
	this.device.previous().then(function() {
		console.log('send previous');
	});
};

SonosClient.prototype.seek = function (seconds) {
	console.log('sonos seek '+seconds);
	this.device.seek(seconds).then(function(err) {
		console.log('sent seek', seconds);
	});
};

SonosClient.prototype.getVolume = function (callback) {
	if (this.lastVolumeTime === null || (new Date().getTime() - this.lastVolumeTime.getTime() > 1000)) {
	//if (new Date().getTime() - this.lastVolumeTime.getTime() > 1000) {
		this.device.getVolume().then((volume) => {
			this.log(`first getVolume = ${volume}`);
			this._setVolume(volume);
			callback();
		});
	}
};

SonosClient.prototype.getMuted = function (callback) {
	this.device.getMuted().then((muted) => {
		this.log(`first getMuted = ${muted}`);
		this._setMuted(muted);
		callback();
	});
};

SonosClient.prototype.startMonitor = function () {
	clearInterval(this.monitor);
	var me = this;
	this.monitor = setInterval(function() {
		me.getVolume(function() {});
		me.getMuted(function() {});
		me.getPlayState(function() {});
	},500);
};

SonosClient.prototype.stopMonitor = function () {
	clearInterval(this.monitor);
};

module.exports = SonosClient;