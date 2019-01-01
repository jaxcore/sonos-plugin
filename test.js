var Spin = require('jaxcore-spin');
var plugin = require('jaxcore-plugin');
var SonosService = require('./service');
var SonosClient = require('./client');

// SonosService.scan(function(err, device, state) {
// 	console.log('found', device, state);
// }, function() {
// 	console.log('scan complete');
// });

let sonos = new SonosClient({
	host: '192.168.0.31'
});

sonos.on('connected', function() {
	console.log('connected');
});

sonos.connect();

Spin.connectAll(function(spin) {
	console.log('connected spin', spin.id, spin.state);
	
	// spin.on('connect', function() {
	// 	// adapter.emit('spin-connected', spin);
	// 	console.log('spin connected', spin.state);
	//
	// 	process.exit();
	//
	// 	// var devices = {
	// 	// 	spin: spin,
	// 	// 	kodi: kodi,
	// 	// 	receiver: receiver
	// 	// };
	// 	// var adapter = new KodiAdapter(devices);
	// });
	
	spin.on('disconnect', function() {
		console.log('spin disconnected');
	});
	
	spin.on('spin', function(direction) {
		console.log('spin', direction);
		
		if (direction===1) sonos.audio.volumeUp();
		else sonos.audio.volumeDown();
	});
	
	spin.on('button', function(pushed) {
		console.log('button', pushed);
	});
	
	spin.on('knob', function(pushed) {
		console.log('knob', pushed);
	});
	
});