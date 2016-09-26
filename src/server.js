'use strict';

var net    = require('net');
var config = require('./config.json');
var debug  = require('debug');

var verbose = false;

var host = config.host;
var port = config.port;
var registeredUsers = config.registeredUsers;

var clients = [];

var game = {
	cols: 7,
	rows: 9,
	fov: 3,
	map: [
		1, 1, 1, 1, 1, 1, 1,
		1, 0, 0, 1, 0, 0, 1,
		1, 0, 1, 0, 1, 0, 1,
		1, 0, 1, 0, 1, 0, 1,
		1, 0, 0, 0, 1, 0, 1,
		1, 0, 1, 2, 1, 0, 1,
		1, 3, 0, 1, 0, 0, 1,
		1, 0, 0, 0, 0, 0, 1,
		1, 1, 1, 1, 1, 1, 1
	],
	players: [],
	turnsLeft: 100,
	turnTime: 1000, // ms
	nextTurn: function() {
		this.turnsLeft--;
		for(var i in this.players) {
			// Send OK to players who are waiting
			if(this.players[i].waiting && clients.indexOf(this.players[i].socket) >= 0)
				this.players[i].socket.write('OK\n');
			// Enable players to move
			this.players[i].moved = false;
			this.players[i].waiting = false;
		}
	}
};

function showScores() {
	console.log('[SCORES]');
	for(var i in registeredUsers) {
		console.log(registeredUsers[i].name + ' | ' + game.players[registeredUsers[i].id].score);
	}
}

function login(id, socket, words) {

	// Check if user is already paired
	if(id >= 0) {
		socket.write('ERR 106 Already logged in\n');
		return id;
	}
	// Check if username matches password, if so pair socket to id
	if(words.length < 2) {
		// Too little arguments
		socket.write('ERR 103 Wrong arguments\n');
		return -1;
	}
	var user = registeredUsers[words[0]];
	if(user === undefined) {
		// Wrong login or password
		socket.write('ERR 105 Wrong login or password\n');
		return -1;
	}
	if(user.password == words[1])
		id = user.id;
	if(id >= 0) {
		game.players[id].socket = socket;
		console.log(socket.remoteAddress + ':' + socket.remotePort + ' => ' + words[0]);
		socket.write('OK\n');
		return id;
	} else {
		// Wrong login or password
		console.log(words);
		socket.write('ERR 105 Wrong login or password\n');
		return -1;
	}
}

function playerMove(id, socket, words) {
	if(id < 0) {
		socket.write('ERR 101 Not connected\n');
		return;
	}
	if(words.length < 2) {
		// Too little arguments
		socket.write('ERR 103 Wrong arguments\n');
		return;
	}
	if(game.players[id].moved) {
		socket.write('ERR 111 Already moved this turn\n');
		return;
	}
	var x = parseInt(words[0], 10);
	var y = parseInt(words[1], 10);

	if((x != 0 || (y != -1 && y != 0 && y != 1)) 
	&& (y != 0 || (x != -1 && x != 0 && x != 1))) {
		socket.write('ERR 110 Invalid move\n');
		return;
	}
	var px = game.players[id].x + Math.floor(game.cols / 2) + x;
	var py = -game.players[id].y + Math.floor(game.rows / 2) - y;

	if(game.map[py*game.cols + px] != 1) {
		if(game.map[py*game.cols + px] == 3 && game.players[id].finished == false) {
			game.players[id].finished = true;
			game.players[id].score += game.turnsLeft;
			showScores();
		}
		game.players[id].x += x;
		game.players[id].y += y;
		game.players[id].moved = true;
		socket.write('OK\n');
	} else {
		socket.write('ERR 110 Invalid move\n');
	}
	
}

function playerScan(id, socket, words) {
	if(id < 0) {
		socket.write('ERR 101 Not connected\n');
		return;
	}
	var q = [];
	var vis = [];
	for(var i = 0; i < game.cols*game.rows; i++) vis[i] = 0;
	var dir = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1},];

	var px = game.players[id].x + Math.floor(game.cols / 2);
	var py = -game.players[id].y + Math.floor(game.rows / 2);
	var sx = px;
	var sy = py;
	
	var chars = ['F', 'W', 'S', 'E'];

	q.push(sy*game.cols + sx);
	vis[sy*game.cols + sx] = 1;
	while(q.length > 0) {
		sx = q[0] % game.cols;
		sy = Math.floor(q[0] / game.cols);
		socket.write(chars[game.map[sy*game.cols + sx]] + ' ' + (sx - px) + ' ' + (-1*(sy - py)) + '\n');
		q.splice(0, 1);
		// End when reached the field of view limit
		if(vis[sy*game.cols + sx] > game.fov + 1)
			break;
		if(game.map[sy*game.cols + sx] === 1)
			continue;

		for(var i = 0; i < 4; ++i) {
			var x = sx + dir[i].x;
			var y = sy + dir[i].y;
			if(x >= 0 && x < game.cols && y >= 0 && y < game.rows) {
				if(vis[y*game.cols + x] === 0) {
					vis[y*game.cols + x] = vis[sy*game.cols + sx] + 1;
					q.push(y*game.cols + x);
				}
			}
		}

	}

	// DEBUG
	var x = game.players[id].x + Math.floor(game.cols / 2);
	var y = -game.players[id].y + Math.floor(game.rows / 2);

	console.log(x, y);
	for(var i = -2; i <= 2; i++) {
		var s = '';
		for(var j = -2; j <= 2; j++) {
			var xj = x + j;
			var yi = y + i;
			if(xj >= 0 && xj < game.cols && yi >= 0 && yi < game.rows) {
				var tile = game.map[yi*game.cols + xj];
				if(i == 0 && j == 0)
					s += '@';
				else if(tile == 0)
					s += '.'
				else if(tile == 1)
					s += '#'
				else
					s += tile;
			} else {
				s += '~';
			}
		}
		console.log(s);
	}
	console.log('');
	socket.write('OK\n');	
}

// Create a server instance, and chain the listen function to it
net.createServer(function(socket) {
	// New connection
	var id = -1;
	clients.push(socket);
	console.log('[CON]: ' + socket.remoteAddress +':'+ socket.remotePort + ' | ' + clients.length);
	socket.write('OK\n');

	// Data handler 
	socket.on('data', function(data) {
		if(verbose) {
			console.log('[DATA]: ' + socket.remoteAddress +':'+ socket.remotePort);
			console.log('  data: ' + data);
		}
		var str = data.toString();
		str = str.replace(/\n/g, '');
		str = str.replace(/\r/g, '');
		// Omit empty data
		if(str.length <= 1) {
			return;
		}
		// Split data into words and scrap \n and \r
		var words = str.split(' ');
		// First word is a command
		var command = words[0];
		words.splice(0, 1);

		// Don't process commands other than LOGIN before logging in
		if(id < 0 && command !== 'LOGIN') {
			socket.write('ERR 101 Not connected\n');
			return;
		}

		// Process commands
		switch(command) {
			case 'LOGIN':
				id = login(id, socket, words);
				break;
			case 'MOVE':
				playerMove(id, socket, words);
				break;
			case 'SCAN':
				playerScan(id, socket, words);
				break;
			case 'WAIT':
				game.players[id].waiting = true;
				socket.write('OK\n');
				break;
			case 'TURNS_LEFT':
				socket.write('OK\n' + game.turnsLeft + '\n');
				break;
			default:
				console.log(command);
				socket.write('ERR 102 Unknown command\n');
		}
	});
	
	// Close connection and remove client
	socket.on('close', function(data) {
		var index = clients.indexOf(socket);
		clients.splice(index, 1);

		console.log('[DIS]: ' + socket.remoteAddress + ':' + socket.remotePort + ' | ' + clients.length);
	});
	
}).listen(port, host);

console.log('Server listening on ' + host +':'+ port);

for(var a = 2; a < process.argv.length; a++) {
	// More verbose output
	switch(process.argv[a]) {
		case 'verbose':
			console.log('Verbose mode on');
			verbose = true;
			break;
		// case 'visuals':
		// 	console.log('Logging visuals to stderr');
		// 	process.stderr.write('w' + game.cols + '\n');
		// 	process.stderr.write('h' + game.rows + '\n');
		// 	for(var y = 0; y < game.rows; y++) {
		// 		for(var x = 0; x < game.cols; x++) {
		// 			process.stderr.write('t' + x + ' ' + y + ' '+ game.map[y*game.cols + x] + '\n');
		// 		}
		// 	}
		// 	var visualsInterval = setInterval(function(){
		// 		for(var i in registeredUsers) {
		// 			var id = registeredUsers[i].id;
		// 			process.stderr.write('p' + id + ' ' + game.players[id].x + ' ' + game.players[id].y + '\n');
		// 		}
		// 	}, 500);
		// 	break;
		default:
			console.log('Unknown option ' + process.argv[a]);
	}
}

// Set starting position
for(var i in registeredUsers) {
	var id = registeredUsers[i].id
	game.players[id] = {
		x: 0,
		y: 0,
		waiting: false,
		moved: false,
		finished: false,
		score: 0
	};
}

var turnInterval = setInterval(function(){
	game.nextTurn();
}, game.turnTime);

process.on('error', function(error) {
	console.log(error);
});