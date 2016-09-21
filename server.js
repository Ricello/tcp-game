'use strict';

var net = require('net');
var config = require('./config.json')

var host = config.host;
var port = config.port;

var clients = [];

function process(json) {
	console.log(json);
}

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
net.createServer(function(socket) {
	
	// We have a connection - a socket object is assigned to the connection automatically
	console.log('(con): ' + socket.remoteAddress +':'+ socket.remotePort);
	clients.push(socket);
	console.log('Clients connected: ' + clients.length);

	// // Add a 'data' event handler to this instance of socket
	socket.on('data', function(data) {
		// Log
		var words = data.toString().split(' ');
		for(var w in words) {
			console.log('w: ' + words[w]);
		}

		// Respond
		socket.write('OK\n');		
	});
	
	// Close connection
	socket.on('close', function(data) {
		// Remove client
		var index = clients.indexOf(socket);
		clients.splice(index, 1);
		// Log
		console.log('(dis): ' + socket.remoteAddress +' '+ socket.remotePort);
		console.log('Clients connected: ' + clients.length);
	});
	
}).listen(port, host);

console.log('Server listening on ' + host +':'+ port);