var request = require('request');
var http = require('http');
var xml_digester = require("xml-digester");
var digester = xml_digester.XmlDigester({});
require("date-format-lite");

function update() {

    var y = 1;

    var host = 'localhost';

    // display title and date / time
    var options = {
        host: host,
        port: 80,
        //port: 8080,
        path: '/peggy/write?board=0&x=1&y=' + y + '&text=FIFA+Results+for+' + encodeURIComponent(new Date().format('DDDD, MMMM D H:mm A') + "                    "),
        agent: false
    };

    http.get(options, function (res) {
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });

    y = y + 2;

    var fifaFeedUrl = 'http://worldcup.sfg.io/matches/today';
    request(fifaFeedUrl, function (err, resp, body) {

        //24 @ Arena Pernambuco - Italy: 0, Costa Rica: 0{g} @ 11:00
        //25 @ Arena Fonte Nova - Switzerland: 0, France: 0{g} @ 2:00
        //26 @ Arena da Baixada - Honduras: 0, Ecuador: 0{g} @ 5:00
        if (!err && resp.statusCode == 200) {
            try {

                var matches = JSON.parse(body);

                for (var i = 0; i < matches.length; i++) {
                    var match = matches[i];

                    var homeColor = "";
                    var awayColor = "";

                    if (match.home_team.goals > match.away_team.goals) {
                        homeColor = "{o}";
                        awayColor = "{r}";
                    }
                    else if (match.home_team.goals < match.away_team.goals) {
                        homeColor = "{r}";
                        awayColor = "{o}";
                    }

                    var matchString = match.match_number + " @ " + match.location + " - " +
                        homeColor + match.home_team.country + ": " + match.home_team.goals + ", " +
                        awayColor + match.away_team.country + ": " + match.away_team.goals;

                    matchString = matchString + "{g}";
                    if (match.status == "future") {
                        matchString = matchString + " @ " + new Date(match.datetime).format("H:mm A");
                    }
                    else if (match.status == "in progress") {
                        matchString = matchString + " - In Progress";
                    }
                    else {
                        matchString = matchString + " - Final";
                    }

                    console.log(matchString);

                    var options = {
                        host: host,
                        port: 80,
                        //port: 8080,
                        path: '/peggy/write?board=0&x=3&y=' + y + '&text=' + encodeURIComponent(matchString) + "                    ",
                        agent: false
                    };

                    http.get(options, function (res) {

                    }).on('error', function (e) {
                        console.log("Got error: " + e.message);
                    });

                    y = y + 1;
                }

            } catch (error) {
                var options = {
                    host: host,
                    port: 80,
                    //port: 8080,
                    path: '/peggy/write?board=0&x=3&y=' + y + '&text=' + encodeURIComponent(error.message) + "                    ",
                    agent: false
                };

                http.get(options, function (res) {

                }).on('error', function (e) {
                    console.log("Got error: " + e.message);
                });
            }
        }
        else {
            var options = {
                host: host,
                port: 80,
                //port: 8080,
                path: '/peggy/write?board=0&x=3&y=' + y + '&text=' + encodeURIComponent(err) + "                    ",
                agent: false
            };

            http.get(options, function (res) {

            }).on('error', function (e) {
                console.log("Got error: " + e.message);
            });
        }
    });
}

update();
setInterval(update, 1 * 60 * 1000);
