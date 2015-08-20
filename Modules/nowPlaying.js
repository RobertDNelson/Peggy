var request = require('request');
var http = require('http');
var xml_digester = require('xml-digester');
var digester = xml_digester.XmlDigester({});
require('date-format-lite');

var options = {
    host: 'localhost',
    port: 8080,
    agent: false
};

var PADDING = '                                                              ';

function update() {

    var nowPlayingFeedUrl = 'http://ws.audioscrobbler.com/1.0/user/CoCoDT/recenttracks.rss?limit=3';

    request({
        url:nowPlayingFeedUrl,
        followRedirect: false
    }, function (err, resp, body) {

        if (err) {
            console.log('could not reach now playing server: ' + err);
            return;
        }

        digester.digest(body, function (err, result) {

            if (err) {
                console.log('could not parse now playing result: ' + err);
                // return;
            }

            result = result || {};
            var rss = result.rss || {};
            var channel = rss.channel || {};
            var items = channel.item || [];
            var nowPlaying = items[0] || {title: "The Beatles - Help!"};
            var lastPlayed = items[1] || {title: "Jonathan Coulton - Code Monkey"};
            var doublePrev = items[2] || {title: err};

            options.path = '/peggy/write?board=1&x=1&y=9&text=' + encodeURIComponent('{g}Now Playing: ' + nowPlaying.title + PADDING);
            http.get(options).on('error', function (e) {
                e = e || {};
                console.log('Got error: ' + e.message);
            });

            options.path = '/peggy/write?board=1&x=1&y=10&text=' + encodeURIComponent('{o}Last Played: ' + lastPlayed.title + PADDING);
            http.get(options).on('error', function (e) {
                e = e || {};
                console.log('Got error: ' + e.message);
            });

            options.path = '/peggy/write?board=1&x=1&y=11&text=' + encodeURIComponent('{r}Double Prev: ' + doublePrev.title + PADDING);
            http.get(options).on('error', function (e) {
                e = e || {};
                console.log('Got error: ' + e.message);
            });
        });
    });
}

update();
setInterval(update, 10000);
