var fs = require('fs');
var board = require('./Outputters/Board.js');
var MessageRequest = require('./models/message_request.js');
var express = require('express');
var api = express();
var exec = require('child_process').exec;

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

api.listen(8080);

// Launch any modules
fs.readdir('./Modules', function(err, files) {
	files.forEach(function(file) {
		if (file.match(/\.js$/)) {
			var mod = require('./modules/'+file);
			exec('node '+mod);
		}
	});
});
