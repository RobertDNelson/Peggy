var http = require('http');

var colors = ['{bor}', '{brg}', '{bgo}'];

var board = {id: 1, 'cols': 80, 'rows': 12, discoRow: 4, discoCol: 5};

var options = {
  host: 'localhost', // 10.105.4.251
  port: 8080,
  agent: false
};

process.on('message', function(search) {
  process.env['discoTextText'] = search['text'];
  drawLine();
  update();
});

function drawLine() {
  var text = process.env['discoTextText'];
  if (text && text.length > 0) {
    var out = repeatString(" ", board.discoCol);
    for (var i=0; i<text.length; i++) {
      var randomColor = colors[Math.floor(Math.random() * (3))];
      out += randomColor + text.substring(i, i + 1);
    }
    out += repeatString(" ", board.cols - text.length - board.discoCol);
    writeCell(0, board.discoRow, out);
    console.log("Writing \"" + out + "\"");
  } else {
    writeCell(0, board.discoRow, repeatString(" ", board.cols));
  }
}

function update() {

  var text = process.env['discoTextText'];

  if (text && text.length > 0)
  {
    var randomChar = " ";
    var randomSlot = 0;

    while (randomChar === " ") {
      randomSlot = Math.floor(Math.random() * (text.length));
      randomChar = text.substring(randomSlot, randomSlot + 1);
    }

    var randomColor = colors[Math.floor(Math.random() * (3))];

    writeCell(randomSlot + board.discoCol, board.discoRow, randomColor + randomChar);
  }
}

function repeatString(str, num) {
    return new Array( num + 1 ).join( str );
}

function writeCell(x, y, msg) {
    options.path = "/peggy/write?board=" + board.id + "&x=" + x + "&y=" + y + "&text=" + encodeURIComponent(msg);
    http.get(options).on('error', simpleLogError);
}

function simpleLogError(e) {
    e = e || {};
    console.log('Got error: ' + e.message);
}

update();
setInterval(update, 1000);
