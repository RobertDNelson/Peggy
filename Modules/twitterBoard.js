var util = require('util');
var twitter = require('twitter');
var twit = new twitter({
    consumer_key: process.env.COCO_TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.COCO_TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.COCO_TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.COCO_TWITTER_ACCESS_TOKEN_SECRET
});
var http = require('http');

function colorlessLength(s) {
  return s.replace(/\{.{1}\}/g, "").length;
}

function colorLength(s) {
  return s.length - colorlessLength(s);
}

process.on('message', function(search) {
  process.env['twitterSearchTerm'] = search['term'];
  update();
});

function update() {

  var searchTerm = process.env['twitterSearchTerm'] || "@CoCoMSP";

  twit.search(searchTerm, function(data) {
    var curRowNum = 1;
    var maxRows = 12;
    var maxCharsPerRow = 80;
    var charsLeft = maxCharsPerRow;
    var thisRow = "";
    var colors = ["{r}", "{o}", "{g}"];
    var curColor = 0;
    var rows = [];

    rows[0] = "{g}*************** " + searchTerm + " Tweets ********************************************************";

    for (var i in data.statuses) {

      var tweet = data.statuses[i];

      // We'll switch colors on every tweet
      var curColorCode = colors[curColor++ % 3];

      // var tweetBody = tweet['text'].encode('ascii', 'ignore')
      var thisTweet = "@" + tweet.user.screen_name + ": " + tweet.text.replace(/[^\x00-\x7F]/g, "").replace(/http:\/\/[a-zA-Z0-9\./\=\-_?]*/g, "");
      thisTweet = thisTweet.replace(/&amp;/, "&");

      while (curRowNum < maxRows) {

        if (thisTweet.length < maxCharsPerRow - colorlessLength(thisRow)) {
          // This tweet will fit nicely into this row
          thisRow += curColorCode + thisTweet.substring(0, maxCharsPerRow - colorlessLength(thisRow)) + " ";
          break;
        } else {
          // We'll have to break this tweet into two rows

          // First, we'll append what we can and put the current row into the array
          var amountOfTweet = maxCharsPerRow - colorlessLength(thisRow);
          thisRow += curColorCode + thisTweet.substring(0, amountOfTweet);
          rows[curRowNum++] = thisRow;

          if (curRowNum >= maxRows) {
            // We're out of rows, so let's get outta here.
            break;
          } else {
            // Let's trim off the what we already printed off
            thisTweet = thisTweet.substring(amountOfTweet).trim();
            thisRow = "";
          }
        }
      }
    }

    for (var i = 0; i < rows.length; i++) {
      var options = {
        host: "localhost",
        port: 8080,
        path: "/peggy/write?board=2&x=0&y=" + i + "&text=" + encodeURIComponent(rows[i]),
        agent: false
      };

      http.get(options, function(res) {
        }).on('error', function(e) {
          console.log("Got error: " + e.message);
        });
    }
  });

  return {
    message: function(obj) {
      console.log("message called. obj == " + obj);
      update();
    }
  }
}

update();
setInterval(update, 2 * 60 * 1000);
