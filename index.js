module.exports = {
	services: {
		sonos: {
			service: require('./sonos-client'),
			storeType: 'client'
		}
	},
	adapters: {
		sonos: require('./sonos-adapter')
	}
};