var http = require('http');

var colors = ['{g}', '{r}', '{o}'];

process.on('message', function(search) {
  process.env['discoTextText'] = search['text'];
  update();
});

function update() {

  var text = process.env['discoTextText'];

  if (text && text.length > 0)
  {
    var randomSlot = Math.floor(Math.random() * (text.length));
    var randomChar = text.substring(randomSlot, randomSlot + 1);
    var randomColor = colors[Math.floor(Math.random() * (3))];

	var options = {
      host: '10.105.4.251',
      path: '/peggy/write?board=1&x=' + (randomSlot + 5) + '&y=4&text=' + encodeURIComponent(randomColor + randomChar),
      agent: false
    };

	http.get(options, function(res) {
      }).on('error', function(e) {
        console.log("Got error: " + e.message);
      });
  }
}

update();
setInterval(update, 1000);
