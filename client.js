var EventEmitter = require('events');
var net = require("net");
var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var sonosStore = plugin.createStore('Sonos Store');
var sonosInterface = require('./interface.js');
const { Sonos } = require('sonos');

// CLIENT -----------------------

var _instance = 0;
function SonosClient(config) {
	this.constructor();
	config.id = SonosClient.id(config);
	
	this.setStore(sonosStore);
	this.bindInterface(sonosInterface, config);
	
	this.log = plugin.createLogger('Sonos Client '+(_instance++));
	this.log('create', config);
	
	this.id = this.state.id;
	
	this.lastVolumeTime = 0;
	// this._onError = this.onError.bind(this);
	// this._onData = this.onData.bind(this);
	// this._onClose = this.onClose.bind(this);
	// this._onConnect = this.onConnect.bind(this);
}

SonosClient.prototype = new Client();
SonosClient.prototype.constructor = Client;

SonosClient.id = function(config) {
	return config.host; //+':'+config.port;
};

SonosClient.prototype.update = function() {
};

SonosClient.prototype.connect = function() {
	this.log('connecting to', this.state.host);
	
	this.device = new Sonos(this.state.host);
	
	//this.device.play().then(() => console.log('now playing'));
	
	this.device.getVolume().then((volume) => {
		this.log(`volume = ${volume}`);
		
		this.emit('connected');
	});
};

SonosClient.prototype.disconnect = function(options) {
	this.log('disconnecting...');
};

module.exports = SonosClient;