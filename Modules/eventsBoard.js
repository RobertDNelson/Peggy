var request = require('request');
var http = require('http');
var xml_digester = require("xml-digester");
var digester = xml_digester.XmlDigester({});
require("date-format-lite");
var util = require('util');
var HTMLDecoderEncoder = require("html-encoder-decoder"), encoded = null;
var ical = require('ical');

function update() {
    var url = "https://www.google.com/calendar/feeds/cocomsp.com_qhpaqd48qabnbg034ghh0c5vs4%40group.calendar.google.com/public/full?alt=json&orderby=starttime&max-results=11&singleevents=true&sortorder=ascending&futureevents=true";
    request(url, function(err, res, body) {
        console.log("res.statusCode == " + res.statusCode);
        if (!err && res.statusCode == 200) {
            var eventsObj = JSON.parse(body);

            console.log("eventsObj: " + util.inspect(eventsObj.feed.entry));

            var rows = [];
            rows[0] = "{o}*************** CoCo Events ***************************************************";

            for (i in eventsObj.feed.entry) {
                var event = eventsObj.feed.entry[i];
                var title = event.title.$t;
                var when = event.gd$when[0].startTime;
                if (when.split("-").length == 3) {
                    parts = when.split("-");
                    when = new Date(parts[0], (parts[1] - 1), parts[2]).format("MMM D");
                } else {
                    when = new Date(when).format("MMM D at H:mm A");
                }
                rows[i + 1] = when + " - " + title;
            }

            for (var i = 0; i < 12; i++) {

                var options = {
                    host: "localhost",
                    port: 8080,
                    path: "/peggy/write?board=3&x=0&y=" + i + "&text=" + encodeURIComponent(" " + rows[i] + "                                                            "),
                    agent: false
                };

                http.get(options, function(res) {
                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                    });
            }

        } else {
            console.log("result came back " + res.statusCode);
        }

    })
}

update();
setInterval(update, 60 * 60 * 1000);
