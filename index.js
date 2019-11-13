module.exports = {
	services: {
		sonos: require('./sonos-service')
	},
	stores: {
		sonos: 'client'
	},
	adapters: {
		sonos: require('./sonos-adapter')
	}
};