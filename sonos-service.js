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
	
	scan() {
		DeviceDiscovery((device) => {
			this.log('found device at ' + device.host);
			this.emit('device', device);
		});
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
			SonosService.startService();
		}
		
		if (sonosInstance.clients[serviceId]) {
			let instance = sonosInstance.clients[serviceId];
			instance.log('RETURNING SONOS CLIENT', instance);
			process.exit();
			callback(null, instance);
		}
		else {
			sonosInstance.log('CREATE SONOS', serviceId, serviceConfig);
			
			let onDevice = (device) => {
				if (device.host === serviceConfig.host &&
					device.port === serviceConfig.port) {
					
					sonosInstance.log('found sonos', device);
					
					let instance = sonosInstance.create(serviceStore, serviceId, serviceConfig, device);
					callback(null, instance);
					
					// process.exit();
					
					sonosInstance.removeListener('device', onDevice);
				}
			};
			// todo: setTimeout remove listener
			sonosInstance.addListener('device', onDevice);
			
			sonosInstance.scan();
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
