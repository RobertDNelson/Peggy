var request = require('request');
var http = require('http');
var host = '10.1.100.4';
var startLine = 6
var currentFeedIndex = 0;
var pad = '                                                                             ';
var news;
var writtenLines = 0;
function update() {
    writtenLines = 0;
    var titleText = ('{r}TOP STORIES: ' + newsFeeds[currentFeedIndex].name + pad).substring(0, pad.length);
    
    request({url:'http://10.1.100.4/peggy/clear?board=0'},function(err,resp,body){
        setTimeout(function(){
            // display title
            var options = {
                host: host,
                port: 80,
                //port: 8080,
                path: '/peggy/write?board=0&x=0&y='+startLine+'&text=' + encodeURIComponent(titleText),
                agent: false
            };
            http.get(options, function (res) {
                writtenLines++;
                getNewsFeed();
            });
        },100)
    });
}

function getNewsFeed() {
   var opts = {
        url: newsFeeds[currentFeedIndex].url
    };

    request(opts, function (err, resp, body) {
        
        // Headlines are all between <title> tags.
        news = JSON.parse(body);
        setTimeout(writeNewsLine, 100);
    });
    currentFeedIndex++;
    if(currentFeedIndex >= newsFeeds.length)
        currentFeedIndex = 0;
}



function writeNewsLine(){
    try{
        var article = news.articles.shift();
        var headline = article.title.toUpperCase();
        console.log("Writing headline: " + headline);
        var headline = (headline + pad).substring(0, pad.length);
        var options = {
            host: host,
            port: 80,
            path: '/peggy/write?board=0&x=0&y=' + (startLine+writtenLines) + '&text=' + encodeURIComponent(headline),
            agent: false
        };

        http.get(options, function (res) {
            writtenLines++;
            if(writtenLines <= 5){
                setTimeout(function() {
                    writeNewsLine();
                }, 100);
            } 
        }).on('error', function (e) {
            console.log("Got error: " + e.message);
        });
    } catch(e){
        console.log("Got error: " + e.message);
        setTimeout(function() {
            writeNewsLine();
        }, 100);
    }

    
}

var newsFeeds = [{
    name: 'ARS TECHNICA',
    url: 'https://newsapi.org/v1/articles?source=ars-technica&sortBy=top&apiKey=9e4b535f632b4086bdaa9b3617f3eac4'
},{
    name: 'ASSOCIATED PRESS (AP)',
    url:' https://newsapi.org/v1/articles?source=associated-press&sortBy=top&apiKey=9e4b535f632b4086bdaa9b3617f3eac4'
},{
    name: 'BBC',
    url:'https://newsapi.org/v1/articles?source=bbc-news&sortBy=top&apiKey=9e4b535f632b4086bdaa9b3617f3eac4'
},{
    name: 'BLOOMBERG',
    url:'https://newsapi.org/v1/articles?source=bloomberg&sortBy=top&apiKey=9e4b535f632b4086bdaa9b3617f3eac4'
},{
    name: 'BUSINESS INSIDER',
    url:'https://newsapi.org/v1/articles?source=business-insider&sortBy=top&apiKey=9e4b535f632b4086bdaa9b3617f3eac4'
},{
    name:'CNBC',
    url:'https://newsapi.org/v1/articles?source=cnbc&sortBy=top&apiKey=9e4b535f632b4086bdaa9b3617f3eac4'
},{
    name: 'GOOGLE NEWS',
    url:'https://newsapi.org/v1/articles?source=google-news&sortBy=top&apiKey=9e4b535f632b4086bdaa9b3617f3eac4'
},{
    name: 'NEW YORK TIMES',
    url:'https://newsapi.org/v1/articles?source=the-new-york-times&sortBy=top&apiKey=9e4b535f632b4086bdaa9b3617f3eac4'
},{
    name: 'REUTERS',
    url:'https://newsapi.org/v1/articles?source=reuters&sortBy=top&apiKey=9e4b535f632b4086bdaa9b3617f3eac4'
},{
    name: 'THE WALL STREET JOURNAL',
    url:'https://newsapi.org/v1/articles?source=the-wall-street-journal&sortBy=top&apiKey=9e4b535f632b4086bdaa9b3617f3eac4'
}];
// Kick off the first update process
update();
// Continuously update every 30 seconds
setInterval(update, 1 * 30 * 1000);
