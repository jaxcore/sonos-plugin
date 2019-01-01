var plugin = require('jaxcore-plugin');
var log = plugin.createLogger('Sonos Interface');

module.exports = {
	states: {
		id: {
			type: 'string',
			defaultValue: ''
		},
		host: {
			type: 'string',
			defaultValue: ''
		},
		port: {
			type: 'integer',
			defaultValue: 0
		},
		connected: {
			type: 'boolean',
			defaultValue: false
		},
		identity: {
			type: 'string',
			defaultValue: ''
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
		receivedVolume: {
			type: 'integer',
			defaultValue: 0
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
	},
	devices: {
		audio: {
			actions: {
				volumeUp: function () {
					var v = this.state.volume + this.state.volumeIncrement;
					log('volumeUp', v, this.state.volume, this.state.volumeIncrement);
					this.audio.volume(v);
				},
				volumeDown: function () {
					var v = this.state.volume - this.state.volumeIncrement;
					log('volumeDown', v, this.state.volume, this.state.volumeIncrement);
					this.audio.volume(v);
				},
				toggleMuted: function () {
					var muted = !this.state.muted;
					this.audio.muted(muted);
				},
				mute: function () {
					this.audio.muted(true);
				},
				unmute: function () {
					this.audio.muted(false);
				}
			},
			settings: {
				volume: function (v) {
					if (v<this.state.minVolume) v = this.state.minVolume;
					if (v>this.state.maxVolume) v = this.state.maxVolume;
					console.log('audio.volume()', v);
					this.setState({
						volume: v
					});
					this.device.setVolume(v);
				},
				minVolume: function (v) {
					this.setState({
						minVolume: v
					});
				},
				maxVolume: function (v) {
					this.setState({
						maxVolume: v
					});
				},
				muted: function (muted) {
					log('muted', muted);
				}
			}
			
		},
		player: {
			actions: {
				playPause: function () {
					log('play pause');
				},
				stop: function () {
					log('stop');
				}
			},
			settings: {
				seek: function () {
				}
			}
		}
	}
	
};
