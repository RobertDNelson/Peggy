var request = require('request');
var http = require('http');

function update() {

    var y = 1;

    var host = 'localhost';

    // display title
    var options = {
        host: host,
        port: 80,
        //port: 8080,
        path: '/peggy/write?board=0&x=1&y=' + y + '&text=HEADLINES',
        agent: false
    };

    http.get(options, function (res) {
        getNewsFeed();
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });

}

function getNewsFeed() {
  var opts = {
        url: 'https://newsapi.org/v1/articles?source=ars-technica&sortBy=latest&apiKey=9e4b535f632b4086bdaa9b3617f3eac4',
    };

    request(opts, function (err, resp, body) {
        writtenLines = 0;
        // Headlines are all between <title> tags.
        news = JSON.parse(body);
        setTimeout(writeNewsLine, 3000);
    });
}

var news;
var writtenLines = 0;
function writeNewsLine(){
    var article = news.articles.shift();
    var headline = article.title;
    console.log("Writing headline: " + headline);
    var options = {
        host: 'localhost',
        port: 80,
        //port: 8080,
        path: '/peggy/write?board=0&x=0&y=' + (writtenLines+2) + '&text=' + encodeURIComponent(headline),
        agent: false
    };

    http.get(options, function (res) {
        writtenLines++;
        if(writtenLines < 3){
            setTimeout(function() {
                writeNewsLine(title);
            }, 1000);
        }
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });

    
}


//getNewsFeed();
update();
setInterval(update, 1 * 60 * 1000);
