const plugin = require('jaxcore-plugin');
const Client = plugin.Client;
const {DeviceDiscovery} = require('sonos');
const SonosClient = require('./sonos-client');

var sonosInstance;

class SonosService extends Client {
	constructor() {
		super();
		this.clients = {};
	}
	
	// connect(callback) {
	// 	DeviceDiscovery().once('DeviceAvailable', (device) => {
	// 		console.log('found', device.host);
	// 		let sonos = new SonosClient({}, device);
	// 		sonos.once('connect', function () {
	// 			callback(sonos);
	// 		});
	// 		sonos.connect();
	// 	});
	// }
	//
	// connectTo(host, callback) {
	// 	if (!this.clients[host]) {
	// 		this.clients[host] = new SonosClient({
	// 			host: host
	// 		});
	// 	}
	// 	let sonos = this.clients[host];
	// 	if (sonos.state.connected) {
	// 		callback(sonos);
	// 	}
	// 	else {
	// 		sonos.once('connect', function () {
	// 			console.log('sonos connected', host);
	// 			callback(sonos);
	// 		});
	// 		sonos.connect();
	// 	}
	// }
	//
	scan() {
		DeviceDiscovery((device) => {
			console.log('found device at ' + device.host);
			this.emit('device', device);
		});
	}
	
	create(serviceId, serviceConfig, device) {
		console.log('serviceConfig');
		let client = new SonosClient(serviceId, serviceConfig, device);
		this.clients[client.id] = client;
		return client;
	}
	
	static id(serviceConfig) {
		let id = 'sonos:'+serviceConfig.host+':'+serviceConfig.port;
		console.log('SonosService.id', serviceConfig, 'id', id);
		return id;
	}
	
	static getOrCreateInstance(serviceId, serviceConfig, callback) {
		console.log('SonosService getOrCreateInstance', serviceId, serviceConfig);
		// process.exit();
		
		if (!sonosInstance) {
			SonosService.startService();
		}
		
		if (sonosInstance.clients[serviceId]) {
			let instance = sonosInstance.clients[serviceId];
			console.log('RETURNING SONOS CLIENT', instance);
			process.exit();
			callback(null, instance);
		}
		else {
			console.log('CREATE SONOS', serviceId, serviceConfig);
			
			sonosInstance.addListener('device', function(device) {
				if (device.host === serviceConfig.host &&
					device.port === serviceConfig.port) {
					
					console.log('found');
					
					let instance = sonosInstance.create(serviceId, serviceConfig, device);
					callback(null, instance);
					
					// process.exit();
				}
			});
			
			sonosInstance.scan();
			
			// console.log('CREATED SONOS CLIENT', instance);
			
			// process.exit();
			// callback(null, instance);
			// keyboardInstance = new SonosService(serviceConfig);
		}
	}
	
	static destroyInstance(serviceId, serviceConfig) {
		if (sonosInstance) {
			sonosInstance.destroy();
		}
	}
	
	static startService() {
		if (!sonosInstance) {
			sonosInstance = new SonosService();
		}
		return sonosInstance;
	};
}

module.exports = SonosService;
