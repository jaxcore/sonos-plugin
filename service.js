var EventEmitter = require('events');
var SonosClient = require('./client');
const { DeviceDiscovery } = require('sonos');

function SonosService() {
	this.constructor();
	this.clients = {};
}

SonosService.prototype = new EventEmitter();
SonosService.prototype.constructor = EventEmitter;

SonosService.prototype.connect = function(callback) {
	DeviceDiscovery().once('DeviceAvailable', (device) => {
		console.log('found', device.host);
		let sonos = new SonosClient({}, device);
		sonos.once('connect', function() {
			callback(sonos);
		});
		sonos.connect();
	});
};
SonosService.prototype.connectTo = function(host, callback) {
	if (!this.clients[host]) {
		this.clients[host] = new SonosClient({
			host: host
		});
	}
	let sonos = this.clients[host];
	if (sonos.state.connected) {
		callback(sonos);
	}
	else {
		sonos.once('connect', function() {
			console.log('sonos connected', host);
			callback(sonos);
		});
		sonos.connect();
	}
};
SonosService.prototype.scan = function() {
	DeviceDiscovery((device) => {
		console.log('found device at ' + device.host);
		this.emit('device', device);
	});
};
module.exports = new SonosService();
