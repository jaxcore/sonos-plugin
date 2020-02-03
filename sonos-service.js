const {Service, createLogger} = require('jaxcore');
const {DeviceDiscovery} = require('sonos');
const SonosClient = require('./sonos-client');

let sonosInstance;

class SonosService extends Service {
	constructor() {
		super();
		this.log = createLogger('SonosService');
		this.log('created');
		this.clients = {};
	}
	
	static scan(timeout) {
		return DeviceDiscovery({
			timeout: timeout || 5000
		});
		// DeviceDiscovery((device) => {
		// 	this.log('found device at ' + device.host);
		// 	this.emit('device', device);
		// });
	}
	
	create(serviceStore, serviceId, serviceConfig, device) {
		this.log('serviceConfig');
		let client = new SonosClient(serviceStore, serviceId, serviceConfig, device);
		this.clients[client.id] = client;
		return client;
	}
	
	static id(serviceConfig) {
		return 'sonos:'+serviceConfig.host+':'+serviceConfig.port;
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		if (!sonosInstance) {
			console.log('!sonosInstance');
			SonosService.startService();
		}
		
		if (sonosInstance.clients[serviceId]) {
			let instance = sonosInstance.clients[serviceId];
			instance.log('RETURNING SONOS CLIENT', instance);
			//process.exit();
			callback(null, instance);
		}
		else {
			sonosInstance.log('CREATE SONOS', serviceId, serviceConfig);
			
			// let timeout = setTimeout(() => {
			// 	sonosInstance.removeListener('device', onDevice);
			// 	console.log('SONOS TIMEOUT');
			// 	callback({timout: true});
			// },5000);
			//
			// let onDevice = (device) => {
			// 	if (device.host === serviceConfig.host &&
			// 		device.port === serviceConfig.port) {
			//
			// 		clearTimeout(timeout);
			//
			// 		sonosInstance.log('found sonos', device);
			//
			// 		let instance = sonosInstance.create(serviceStore, serviceId, serviceConfig, device);
			// 		callback(null, instance);
			//
			// 		// process.exit();
			//
			// 		sonosInstance.removeListener('device', onDevice);
			// 	}
			// };
			// sonosInstance.addListener('device', onDevice);
			
			console.log('try scan');
			let scanner = SonosService.scan();
			
			console.log('try scanning...');
			scanner.on('DeviceAvailable', (device, model) => {
				if (device.host === serviceConfig.host && device.port === serviceConfig.port) {
					console.log('found', device, model);
					
					let instance = sonosInstance.create(serviceStore, serviceId, serviceConfig, device);
					callback(null, instance);
					
					scanner.destroy();
				}
				else console.log('DeviceAvailable', device, model);
			});
			scanner.on('timeout', () => {
				console.log('sonos timeout');
				try {
					scanner.destroy();
				}
				catch(e) {
					console.log('destroy');
				}
				callback({timeout: true});
			});
			scanner.on('error', (e) => {
				console.log('sonos error', e);
				try {
					scanner.destroy();
				}
				catch(e) {
					console.log('destroy');
				}
				callback({error: e});
			});
		}
	}
	
	// static destroyInstance(serviceId, serviceConfig) {
	// 	if (sonosInstance) {
	// 		sonosInstance.destroy();
	// 	}
	// }
	
	static startService() {
		if (!sonosInstance) {
			sonosInstance = new SonosService();
		}
		return sonosInstance;
	};
}

module.exports = SonosService;
