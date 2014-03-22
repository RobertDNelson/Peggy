var fs = require('fs');
var board = require('./Outputters/board.js');
var MessageRequest = require('./models/message_request.js');
var express = require('express');
var api = express();

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

	console.log(req.query)
	var message = new MessageRequest(req.query.board, req.query.x, req.query.y, req.query.text);
	board.write(message);
	res.send(200);
});

api.all('/peggy/clear', function(req, res) {
	var boardNumber = parseInt(req.query.board);
	board.clear(boardNumber);
});

api.listen(8080);

// Launch any modules
fs.readdir('./modules', function(err, files) {
	files.forEach(function(file) {
		if (file.match(/\.js$/)) {
			var mod = require('./modules/'+file);
			if (mod.execute) {
				mod.execute();
			}
			else {
				console.log('Unable to execute ' + file + '. No execute method');
			}
		}
	});
});
