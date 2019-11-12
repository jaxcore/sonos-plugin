const {Service, createLogger} = require('jaxcore-plugin');
const {DeviceDiscovery} = require('sonos');
const SonosClient = require('./sonos-client');

const log = createLogger('Sonos');

let sonosInstance;

class SonosService extends Service {
	constructor() {
		super();
		this.clients = {};
	}
	
	// connect(callback) {
	// 	DeviceDiscovery().once('DeviceAvailable', (device) => {
	// 		log('found', device.host);
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
	// 			log('sonos connected', host);
	// 			callback(sonos);
	// 		});
	// 		sonos.connect();
	// 	}
	// }
	//
	scan() {
		DeviceDiscovery((device) => {
			log('found device at ' + device.host);
			this.emit('device', device);
		});
	}
	
	create(serviceStore, serviceId, serviceConfig, device) {
		log('serviceConfig');
		let client = new SonosClient(serviceStore, serviceId, serviceConfig, device);
		this.clients[client.id] = client;
		return client;
	}
	
	static id(serviceConfig) {
		let id = 'sonos:'+serviceConfig.host+':'+serviceConfig.port;
		log('SonosService.id', serviceConfig, 'id', id);
		return id;
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		log('SonosService getOrCreateInstance', serviceId, serviceConfig);
		// process.exit();
		
		if (!sonosInstance) {
			SonosService.startService();
		}
		
		if (sonosInstance.clients[serviceId]) {
			let instance = sonosInstance.clients[serviceId];
			log('RETURNING SONOS CLIENT', instance);
			process.exit();
			callback(null, instance);
		}
		else {
			log('CREATE SONOS', serviceId, serviceConfig);
			
			let onDevice = function(device) {
				if (device.host === serviceConfig.host &&
					device.port === serviceConfig.port) {
					
					log('found sonos', device);
					
					let instance = sonosInstance.create(serviceStore, serviceId, serviceConfig, device);
					callback(null, instance);
					
					// process.exit();
					
					sonosInstance.removeListener('device', onDevice);
				}
			};
			// todo: setTimeout remove listener
			sonosInstance.addListener('device', onDevice);
			
			sonosInstance.scan();
			
			// log('CREATED SONOS CLIENT', instance);
			
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
