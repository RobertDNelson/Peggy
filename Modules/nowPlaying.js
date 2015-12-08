var request = require('request');
var http = require('http');
var xml_digester = require('xml-digester');
xml_digester._logger.level(xml_digester._logger.WARN_LEVEL); // stop showing INFO log entries
var digester = xml_digester.XmlDigester({});
require('date-format-lite');

var options = {
    host: 'localhost',
    port: 8080,
    agent: false
};

var PADDING = '                                                              ';

function update() {

    // TODO: this API key was stolen from some idiot
    // who checked it into their public github
    var nowPlayingFeedUrl = 'http://ws.audioscrobbler.com/2.0?method=user.getRecentTracks&user=CoCoDT&api_key=a6ab4b9376e54cdb06912bfbd9c1f288&limit=3';

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
                return;
            }

            result = result || {};
            var rss = result.lfm || {};
            var channel = rss.recenttracks || {};
            var items = channel.track || [];
            var nowPlaying = items[0] || {name:'?', artist:{_text:'?'}};
            var lastPlayed = items[1] || {name:'?', artist:{_text:'?'}};
            var doublePrev = items[2] || {name:'?', artist:{_text:'?'}};

            var nowPlayingText = '{g}Now Playing: ' + nowPlaying.artist._text + " - " + nowPlaying.name + PADDING;
            var lastPlayedText = '{o}Last Played: ' + lastPlayed.artist._text + " - " + lastPlayed.name + PADDING;
            var doublePrevText = '{r}Double Prev: ' + doublePrev.artist._text + " - " + doublePrev.name + PADDING;

            // var nowPlayingText = '{g}Recently Played: ' + nowPlaying.artist._text + " - " + nowPlaying.name + PADDING;
            // var lastPlayedText = '{o}Less Recently 1: ' + lastPlayed.artist._text + " - " + lastPlayed.name + PADDING;
            // var doublePrevText = '{r}Less Recently 2: ' + doublePrev.artist._text + " - " + doublePrev.name + PADDING;

            // console.log(nowPlayingText + '\n');
            // console.log(lastPlayedText + '\n');
            // console.log(doublePrevText + '\n');

            options.path = '/peggy/write?board=1&x=1&y=9&text=' + encodeURIComponent(nowPlayingText);
            http.get(options).on('error', function (e) {
                e = e || {};
                console.log('Got error: ' + e.message);
            });

            options.path = '/peggy/write?board=1&x=1&y=10&text=' + encodeURIComponent(lastPlayedText);
            http.get(options).on('error', function (e) {
                e = e || {};
                console.log('Got error: ' + e.message);
            });

            options.path = '/peggy/write?board=1&x=1&y=11&text=' + encodeURIComponent(doublePrevText);
            http.get(options).on('error', function (e) {
                e = e || {};
                console.log('Got error: ' + e.message);
            });
        });
    });
}

update();
setInterval(update, 10000);
