"use strict";

var net = require('net');

class Controller {
	constructor(ip, port) {
		ip = ip || "127.0.0.1";
		port = port || 9876;

		this.isConnected = false;

		this.ip = ip;
		this.port = port;

		this.initClient();

		this.connect(ip, port);
	}

	initClient() {
		this.socket = new net.Socket();
		
		this.socket.on('data', function(data) {
			console.log(data);
		});

		this.socket.on('close', function() {
			console.log('Connection closed');
		});
	}

	connect(ip, port) {
		try {
			this.socket.connect(port, ip, function() {
				this.isConnected = true;
			});
		} catch {
			throw SocketError(true);
		}

	}

	checkResponse(response, expected, allowed) {
        var correctResponse = false;
        response = response.replace("\n", "")

        for (var i = 0; i < allowed.length; i++) {
        	if (allowed[i] == response) {
        		correctResponse = true;
        		break;
        	}
        }
        if (!correctResponse) {
            raise ProtocolError(response, expected);
        }
    }

	send(command) {
		command += "\n";
		try {
			this.socket.write(command);
		} catch {
			throw SocketError(this.isConnected);
		}
	}

	moveLeft() {
		var response = this.send("move left");

		this.checkResponse(response, "ok", ["ok", "bye"]);
	}
	
	moveRight() {
		var response = this.send("move right");

		this.checkResponse(response, "ok", ["ok", "bye"]);
	}
	
	grab() {
		var response = this.send("grab");

		this.checkResponse(response, "ok", ["ok", "bye"]);
	}
	
	drop() {
		var response = this.send("drop");

		this.checkResponse(response, "ok", ["ok", "bye"]);
	}
	
	scan() {
		var response = this.send("scan");

		this.checkResponse(response, "a color", ["red", "blue", "green", "white", "none", "bye"]);
	}
	
	setSpeed(speed) {
		var response = this.send("speed " +speed);

		this.checkResponse(response, "ok", ["ok", "bye"]);
	}
	
	loadLevel(name) {
		var response = this.send("load " + name);

		this.checkResponse(response, "ok", ["ok", "nope", "bye"]);
	}


	get timeout() {
		return this.timeout;
	}
	set timeout(seconds) {
		this.timeout = seconds;
		this.socket.setTimeout(seconds * 1000); // socket timeout is in ms so * 1000
	}

	get speed() {
		return this.speed;
	}
	set speed(speed) {
		if (speed < 0 || speed > 1) {
			throw OutOfRangeError();
		}

		this.speed = speed;
		setSpeed(speed);
	}
}


class SocketError extends Error {
	constructor(isConnected) {
		super(message);
		if (isConnected) {
			this.message = "Is the RobotArm server running on ip '"+this.ip+"' and port '"+this.port+"'";
		} else {
			this.message = "You already closed the connection.";
		}
		this.name = 'SocketError';
	}
}

class TimeoutError extends Error {
	constructor() {
		super(message);
		this.message = "The RobotArm took more than "+this.timeout+" seconds to respond.";
		this.name = 'TimeoutError';
	}
}

class ProtocolError extends Error {
	constructor(response, expected) {
		super(message);
		this.message = "The RobotArm server responded with '"+response+"' but expected '"+expected+"'.";
		this.name = 'ProtocolError';
	}
}

class OutOfRangeError extends Error {
	constructor() {
		super(message);
		this.message = "Speed must be higher than (or equal to) 0.0 and lower than (or equal to) 1.0.";
		this.name = 'OutOfRangeError';
	}
}

var Colors = {
	red: 0,
	green: 1,
	blue: 2,
	white: 3,
	none: 4
};
// prevent code from editing the color enum (you cant do 'Colors.red = value')
if (Object.freeze)
	Object.freeze(Colors);



module.exports = { Controller: Controller, Colors: Colors }