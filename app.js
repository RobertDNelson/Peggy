var fs = require('fs');
var board = require('./Outputters/Board.js');
var MessageRequest = require('./models/message_request.js');
var express = require('express');
var api = express();
var fork = require('child_process').fork;
var modules = {};
var util = require('util');

board.connect();

// reset the board
for (var i = 5; i >= 0; i--) {
	board.clear(i);
};

// API
api.all('/peggy/write', function (req, res) {
	if (!req.query.board || !req.query.x || !req.query.y ||  !req.query.text) {
		res.send(500, {error:'invalid request'});
		return;
	}
	res.send(200);
	res.end();

	var message = new MessageRequest(req.query.board, req.query.x, req.query.y, req.query.text);
	board.write(message);
});

api.all('/peggy/clear', function(req, res) {
	if (!req.query.board || !req.query.board > 5) {
		res.send(500, {error:'invalid request'});
		return;
	}

	var boardNumber = parseInt(req.query.board);
	board.clear(boardNumber);
	res.send(200);
	res.end();
});

api.all('/peggy/off', function(req, res) {
	board.turnOff();
	res.send(200);
	res.end();
});

api.all('/peggy/on', function(req, res) {
	// reset the board
	board.turnOn();
	res.send(200);
	res.end();
});

api.all('/peggy/status', function(req, res) {
	res.json({ powerOn: board.isOn(), date: Date.now() });
	res.send(200);
	res.end();
});

api.all('/peggy/twitter', function(req, res) {
	if (!req.query.q) {
		res.send(500, {error:'invalid request'});
		return;
	}
	modules['twitterBoard.js'].kill;
	board.clear(2);
	process.env['twitterSearchTerm'] = req.query.q;
	modules['twitterBoard.js'] = fork('./Modules/twitterBoard.js');
	res.send(200);
	res.end();
});

api.listen(8080);

// Launch any modules
fs.readdir('./Modules', function(err, files) {
	files.forEach(function(file, index, array) {
		if (file.match(/\.js$/)) {
			modules[file] = fork('./Modules/' + file, []);
		}
	});
});
