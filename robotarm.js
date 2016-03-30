"use strict";

var net = require('net');


class SocketError extends Error {
	constructor(isConnected, ip, port) {
		super();
	    if (isConnected) {
			this.message = "Is the RobotArm server running on ip '"+ip+"' and port '"+port+"'";
		} else {
			this.message = "You already closed the connection.";
		}
	    this.name = 'SocketError';
	}
}

class TimeoutError extends Error {
	constructor() {
		super();
		this.name = 'TimeoutError';
		this.message = "The RobotArm took more than "+this.timeout+" seconds to respond.";
	}
}

class ProtocolError extends Error {
	constructor(response, expected) {
		super();
		this.name = 'ProtocolError';
		this.message = "The RobotArm server responded with '"+response+"' but expected '"+expected+"'.";
	}
}

class OutOfRangeError extends Error {
	constructor() {
		super();
		this.name = 'OutOfRangeError';
		this.message = "Speed must be higher than (or equal to) 0.0 and lower than (or equal to) 1.0.";
	}
}


class Controller {
	constructor(ip, port) {
		this.ip = ip || "127.0.0.1";
		this.port = port || 9876;

		this.isConnected = false;

		this.received = false;
		this.receivedData = "";

		this.initSocket();

		this.socket.connect(this.port, this.ip, function() {
			this.isConnected = true;
		});

		var response = this.WaitForData();
		this.checkResponse(response, "hello", ["hello"]);
	}

	initSocket() {
		this.socket = new net.Socket();
		this.socket.setEncoding('utf8');

		this.socket.on('data', function(data) {
			// received data from server
			this.received = true;
			this.receivedData = data;

			console.log("received: " + data);
		});

		this.socket.on('connection', function() {
			// when connected to server
			console.log('Socket connected.');
		});

		this.socket.on('close', function() {
			// When socket closes
			console.log('Socket closed.');
		});

		this.socket.on('timeout', function(data) {
			throw new TimeoutError();
		});

		this.socket.on('error', function(data) {
			throw new SocketError(this.isConnected, this.ip, this.port, this.first);
		});
	}

	checkResponse(response, expected, allowed) {
        var correctResponse = false;
		response = response.replace("\n", "") || "";

        for (var i = 0; i < allowed.length; i++) {
        	if (allowed[i] == response) {
        		correctResponse = true;
        		break;
        	}
        }
        if (!correctResponse) {
            throw new ProtocolError(response, expected);
        }
    }

	send(command) {
		command += "\n";
		try {
			this.socket.write(command);
			this.socket.end();
		} catch(err) {
			throw new SocketError(this.isConnected, this.ip, this.port);
		}
	}

	WaitForData() {
		while(!this.received) {} // wait for data

		var data = this.receivedData;

		this.received = false;
		this.receivedData = "";

		return data;
	}

	moveLeft() {
		this.send("move left");

		var response = this.WaitForData();
		this.checkResponse(response, "ok", ["ok", "bye"]);
	}
	
	moveRight() {
		this.send("move right");
		
		var response = this.WaitForData();
		this.checkResponse(response, "ok", ["ok", "bye"]);
	}
	
	grab() {
		this.send("grab");
		
		var response = this.WaitForData();
		this.checkResponse(response, "ok", ["ok", "bye"]);
	}
	
	drop() {
		this.send("drop");

		var response = this.WaitForData();
		this.checkResponse(response, "ok", ["ok", "bye"]);
	}
	
	scan() {
		this.send("scan");

		var response = this.WaitForData();
		this.checkResponse(response, "a color", ["red", "blue", "green", "white", "none", "bye"]);
	}
	
	setSpeed(speed) {
		this.send("speed " +speed);

		var response = this.WaitForData();
		this.checkResponse(response, "ok", ["ok", "bye"]);
	}
	
	loadLevel(name) {
		this.send("load " + name);

		var response = this.WaitForData();
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
			throw new OutOfRangeError();
		}

		this.speed = speed;
		this.setSpeed(speed);
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