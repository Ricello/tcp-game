'use strict';

var net    = require('net');
var config = require('./config.json');
var debug  = require('debug');

var host = config.host;
var port = config.port;

var registeredUsers = config.registeredUsers;

var clients = [];

function login(words) {
	if(words.length < 2)
		return -1;
	var user = registeredUsers[words[0]];
	if(user === undefined)
		return -1;
	if(user.password == words[1])
		return user.id;
}

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
net.createServer(function(socket) {
	var id = -1;
	// We have a connection - a socket object is assigned to the connection automatically
	console.log('[CON]: ' + socket.remoteAddress +':'+ socket.remotePort);
	clients.push(socket);
	console.log('Clients connected: ' + clients.length);

	// // Add a 'data' event handler to this instance of socket
	socket.on('data', function(data) {
		debug('[DATA]: ' + socket.remoteAddress +':'+ socket.remotePort);
		// Omit empty data
		var str = data.toString();
		if(str.length <= 1) {
			return;
		}
		// Split data into words and scrap newlines
		var words = str.split(' ');
		for(var w in words) {
			var wo = words[w];
			if(wo[wo.length-1] === '\n')
				words[w] = wo.substr(0, wo.length - 1);
		}
		// First word is a command
		var command = words[0];
		words.splice(0, 1);
		debug('[DATA] Command: ' + command);

		// Don't process commands other than LOGIN before logging in
		if(id < 0 && command !== 'LOGIN') {
			socket.write('ERR 00\n');
			return;
		}

		// Depending on command do something
		if(command === 'LOGIN') {
			// Socket already paired with a player id
			if(id >= 0) {
				socket.write('ERR 02\n');
				return;
			}
			// Check if username matches password, if so pair socket to id
			id = login(words);
			if(id >= 0) {
				socket.write('OK\n');
				console.log(socket.remoteAddress + ':' + socket.remotePort + ' => ' + words[0]);
			} else {
				id = -1;
				socket.write('ERR 01\n');
				return;
			}
		// Test id check
		} else if(command === 'MY_ID') {
			console.log(id);
			socket.write('OK\n' + id + '\n');
		} else {
			socket.write('ERR 01\n');
		}
	});
	
	// Close connection and remove client
	socket.on('close', function(data) {
		var index = clients.indexOf(socket);
		clients.splice(index, 1);

		console.log('[DIS]: ' + socket.remoteAddress +' '+ socket.remotePort);
		console.log('Clients connected: ' + clients.length);
	});
	
}).listen(port, host);

console.log('Server listening on ' + host +':'+ port);
debug('[INFO]', registeredUsers);