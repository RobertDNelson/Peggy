var fs = require('fs');
// var board = require('./Outputters/Board.js');
var board = require('./Outputters/DevBoard.js');
var MessageRequest = require('./models/message_request.js');
var express = require('express');
var api = express();
var fork = require('child_process').fork;
var modules = {};
var util = require('util');
var request = require('request');

api.set('view engine', 'jade');
api.use(express.static('public'));

board.connect();

// reset the board
for (var i = 5; i >= 0; i--) {
	board.clear(i);
};

// API
api.all('/peggy/write', function (req, res) {
	if (!req.query.board || !req.query.x || !req.query.y || !req.query.text) {
		res.send(500, {error:'invalid request'});
		return;
	}
	res.send(200);
	res.end();

    var today = new Date();
    var isPirateDay = today.getMonth() == 8 && today.getDate() == 19;
//    console.log("isPirateDay: " + isPirateDay);

    if (isPirateDay && req.query.board != 4) {
    	var text = req.query.text.replace(/\"/g, "");
		request("http://isithackday.com/arrpi.php?format=json&text=" + encodeURIComponent(text), function(err, resp, body) {
		    if (!err && resp.statusCode == 200) {
		    	body = body.replace(/\\{3}/g, "");
//		    	console.log("body: " + body);
		    	var jsonBody = JSON.parse(body);
//		    	console.log("jsonBody.translation.pirate: " + jsonBody.translation.pirate);
		    	var message = new MessageRequest(req.query.board, req.query.x, req.query.y, jsonBody.translation.pirate);
				board.write(message);
		    } else {
		    	var message = new MessageRequest(req.query.board, req.query.x, req.query.y, req.query.text);
				board.write(message);
		    }
		  });
    } else {
		var message = new MessageRequest(req.query.board, req.query.x, req.query.y, req.query.text);
		board.write(message);
    }
});

api.all('/peggy/dev', function(req, res) {
	res.render('dev', {});
});

api.all('/peggy/boardhtml', function(req, res) {
	var boardNumber = parseInt(req.query.board);
	res.send(board.getHtml(boardNumber));
	res.end();
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
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.json(200, { powerOn: board.isOn(), date: Date.now() });
	res.end();
});

api.all('/peggy/twitter', function(req, res) {
	if (!req.query.q) {
		res.send(500, {error:'invalid request'});
		return;
	}
	modules['twitterBoard.js'].send({ term: req.query.q });
	board.clear(2);
	res.send(200);
	res.end();
});

api.all('/peggy/discoText', function(req, res) {
	if (!req.query.text) {
		res.send(500, {error:'invalid request'});
		return;
	}
	modules['discoText.js'].send({ text: req.query.text });
	board.clear(1);
	res.send(200);
	res.end();
});

api.all('/peggy/discoText/off', function(req, res) {
	modules['discoText.js'].send({ text: '' });
	board.clear(1);
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
