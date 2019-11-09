var SonosService = require('./sonos-service');
var SonosAdapter = require('./sonos-adapter');
module.exports = {
	services: {
		sonos: SonosService
	},
	adapters: {
		sonos: SonosAdapter
	}
};