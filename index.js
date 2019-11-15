module.exports = {
	services: {
		sonos: {
			service: require('./sonos-service'),
			storeType: 'client'
		}
	},
	adapters: {
		sonos: require('./sonos-adapter')
	}
};