var net = require('net');
var EventEmitter = require('events');

var sonos = require('sonos');
// https://github.com/bencevans/node-sonos/blob/master/API.md


function Device(config) {
	this.constructor();
	
	this.description = {};
	
	this.state = {
		volume: null,       // 0 - 100
		volumePercent: null, // 0.0 - 1.0
		muted: null,		// bool
		playerActive: false,	// bool
		paused: false,		// bool
	};
	this.settings = {
		maxVolume: 100,
		minVolume: 0,
		volumeInc: 1
	};
	this.connected = false;
}

Device.prototype = new EventEmitter();
Device.prototype.constructor = EventEmitter;

Device.prototype.configure = function (config) {
	this.config = config;
	if (config.maxVolume) {
		this.settings.maxVolume = config.maxVolume;
	}
};

Device.prototype.scan = function () {};

Device.prototype.connect = function () {
	var options = {};
	//port: {Number}
	
	var listener = sonos.search(options);
	
	var me = this;
	
	if (this.config.serialNum) {
		listener.on('DeviceAvailable', function(device) {
			device.deviceDescription(function(err,state) {
				if (me.config.serialNum == state.serialNum) {
					me._connect(device, state);
				}
			});
			
		});
		
		// timeout in 1 minute
	}
	else {
		listener.once('DeviceAvailable', function(device) {
			device.deviceDescription(function(err,state) {
				me._connect(device, state);
			});
		});
	}
	
	// this.listener??
};

Device.prototype._connect = function (device, state) {
	this.device = device;
	this.description = state;
	
	var me = this;
	
	me.getVolume(function() {
		me.getMuted(function() {
			me.getPlayState(function() {
				me.startMonitor();
				me.emit('connect', state.serialNum);
			});
		});
	});
};

Device.prototype.startMonitor = function () {
	clearInterval(this.monitor);
	var me = this;
	this.monitor = setInterval(function() {
		me.getVolume(function() {});
		me.getMuted(function() {});
		me.getPlayState(function() {});
	},1000);
};
Device.prototype.stopMonitor = function () {
	clearInterval(this.monitor);
};

Device.prototype.disconnect = function () {

};

Device.prototype.write = function (d) {

};

// INPUT ---------------------------------------------

Device.prototype.getInput = function () {};
Device.prototype.setInput = function (name) {};
Device.prototype.nextInput = function () {};
Device.prototype.previousInput = function () {};

// -- PLAYBACK ------------

Device.prototype.getPlayState = function (callback) {
	var me = this;
	this.device.getCurrentState(function(err, currState) {
		
		me.device.currentTrack(function(err, track) {
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
				me.state.position = track.position;
				me.state.duration = track.duration;
				me.state.positionPercent = track.position / track.duration;
			}
			else {
				me.state.position = 0;
				me.state.duration = 0;
				me.state.positionPercent = 0;
			}
			
			console.log(currState + ' ' + me.state.position + ' / ' +me.state.duration);
			
			var playerActive, paused;
			
			if (currState === 'paused' || currState === 'transitioning') {
				playerActive = true;
				paused = true;
			}
			else if (currState === 'playing') {
				playerActive = true;
				paused = false;
			}
			else {
				playerActive = false;
				paused = false;
			}
			
			if (playerActive != me.state.paused || paused != me.state.paused) {
				me.state.playerActive = playerActive;
				me.state.paused = paused;
				
				me.emit('playState', {
					playerActive: me.state.playerActive,
					paused: me.state.paused
				});
			}
			
			if (callback) callback();
		});
	});
};

Device.prototype.play = function () {
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
Device.prototype.pause = function () {
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
Device.prototype.stop = function () {
	var me = this;
	this.device.stop(function() {
		me.state.playerActive = false;
		me.state.paused = false;
		me.emit('playState', {
			playerActive: me.state.playerActive,
			paused: me.state.paused
		});
	});
};
Device.prototype.togglePaused = function () {
	if (this.state.playerActive) {
		if (this.state.paused) {
			console.log('going to play');
			this.play();
		}
		else {
			console.log('going to pause');
			this.pause();
		}
	}
	else console.log('oops');
};

Device.prototype.next = function () {
	this.device.next(function() {
	});
};

Device.prototype.previous = function (vol) {
	this.previous.next(function() {
	});
};

Device.prototype.seek = function (seconds) {
	console.log('sonos seek '+seconds);
	this.device.seek(seconds, function(err) {
	
	});
};

// -- VOLUME ------------

Device.prototype.getVolume = function (callback) {
	var me = this;
	if (new Date().getTime() - this.lastVolumeTime < 1000) {
		console.log('skip vol');
		return;
	}
	this.device.getVolume(function(err, volume) {
		if (volume != me.state.volume) {
			console.log('volume = ', volume);
			me.state.volume = volume;
			me.state.volumePercent = volume / me.settings.maxVolume;
			me.emit('volume', me.state.volumePercent, me.state.volume);
			//if (cb) cb()
			//this.emit('volume', this.state.volumePercent, this.state.volume);
			if (callback) callback();
		}
	});
	
};

Device.prototype.setVolume = function (volume, callback) {
	if (volume < this.settings.minVolume) volume = this.settings.minVolume;
	if (volume > this.settings.maxVolume) volume = this.settings.maxVolume;
	var me = this;
	this.lastVolumeTime = new Date().getTime();
	this.device.setVolume(volume, function(err, data) {
		me.state.volume = volume;
		me.state.volumePercent = volume / me.settings.maxVolume;
		me.emit('volume', me.state.volumePercent, me.state.volume);
		if (callback) callback();
		
		//this.emit('volume', this.state.volumePercent, this.state.volume);
	});
};

Device.prototype.changeVolume = function (float) {
	var v = this.state.volume + float;
	console.log('changing volume ...', this.state.volume, v);
	this.setVolume(v);
};

Device.prototype.volumeUp = function () {
	this.changeVolume(this.settings.volumeInc);
};
Device.prototype.volumeDown = function () {
	this.changeVolume(-this.settings.volumeInc);
};

Device.prototype.getMuted = function (callback) {
	var me = this;
	this.device.getMuted(function(err, muted) {
		me.state.muted = true;
		if (callback) callback();
	});
};

Device.prototype.setMuted = function (muted) {
	muted = !!muted;
	
	var me = this;
	this.device.setMuted(muted, function(err) {
		me.state.muted = muted;
		me.emit('muted', muted);
	});
};

Device.prototype.toggleMuted = function () {
	this.setMuted(!this.state.muted);
};


module.exports = Device;