'use strict';

var width, height;

// process.stdin.setRawMode(true);



process.stdin.on('readable', function() {
	var str = String(process.stdin.read());
	var type = str[0];
	str = str.substr(1);
	// console.log('buf:\n' + str);

	// console.log(str);
	switch(type) {
		case 'w':
			// width = parseInt(str, 10);
			break;
		case 'h':
			// height = parseInt(str, 10);
			break;
		case 'r':
			break;
		case 'x':
			break;

	}
})
