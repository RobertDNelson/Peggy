var request = require('request');
var http = require('http');
var xml_digester = require("xml-digester");
var digester = xml_digester.XmlDigester({});
require("date-format-lite");

function update() {
        var maxCharsPerRow = 32;
        var nowPlayingFeedUrl = 'http://ws.audioscrobbler.com/1.0/user/CoCoDT/recenttracks.rss';

        request(nowPlayingFeedUrl, function(err, resp, body) {
            digester.digest(body, function(err, result) {

                var options = {
                    host: 'localhost',
                    port: 8080,
                    path: '/peggy/write?board=1&x=1&y=9&text=' + encodeURIComponent("{g}Now Playing: " + result.rss.channel.item[0].title + "                                                              "),
                    agent: false
                };

                http.get(options, function(res) {

                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                    });

                options = {
                    host: 'localhost',
                    port: 8080,
                    path: '/peggy/write?board=1&x=1&y=10&text=' + encodeURIComponent("{o}Last Played: " + result.rss.channel.item[1].title + "                                                              "),
                    agent: false
                };

                http.get(options, function(res) {

                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                    });

                options = {
                    host: 'localhost',
                    port: 8080,
                    path: '/peggy/write?board=1&x=1&y=11&text=' + encodeURIComponent("{r}Double Prev: " + result.rss.channel.item[2].title + "                                                              "),
                    agent: false
                };

                http.get(options, function(res) {

                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                    });

            });
        });
}

update();
setInterval(update, 20000);
