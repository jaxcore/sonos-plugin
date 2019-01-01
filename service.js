var EventEmitter = require('events');
var net = require("net");
var plugin = require('jaxcore-plugin');
var log = plugin.createLogger('Sonos');
// var sonos = require('sonos');

const { DeviceDiscovery } = require('sonos');
const scanner = DeviceDiscovery();

//var SonosClient = require('./client');

function SonosService() {
	this.constructor();
	this.clients = {};
}

SonosService.prototype = new EventEmitter();
SonosService.prototype.constructor = EventEmitter;

SonosService.prototype.scan = function(callback, done) {
	log('started scanning');
	
	var me = this;
	
	var handler = function(device) {
		log('found device at ' + device.host);
		
		// device.deviceDescription(function(err,state) {
		// 	if (err) {
		// 		callback(err);
		// 	}
		// 	else {
		// 		callback(null, device, state);
		// 	}
		// });
	};
	
	scanner.addListener('DeviceAvailable', handler);
	
	setTimeout(function() {
		scanner.removeListener('DeviceAvailable', handler);
		console.log('stopped scanning');
		done();
	}, 10000);
};

module.exports = new SonosService();
