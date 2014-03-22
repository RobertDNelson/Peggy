var board = require('./Outputters/board.js');
var MessageRequest = require('./models/message_request.js');
var express = require('express');
var api = express();

board.connect();

api.get('/peggy/write', function (req, res) {
	console.log(req.query)
	var message = new MessageRequest(0, req.query.x, req.query.y, req.query.text);
	board.write(message);
	res.send(200);
});

api.listen(8080);

setInterval(function(){
	var date = new Date;
	var req = new MessageRequest(2, 0, 0, date.getTime().toString());	
	board.write(req);
}, 1000);