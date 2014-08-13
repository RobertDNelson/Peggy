var request = require('request');
var http = require('http');
var xml_digester = require("xml-digester");
var digester = xml_digester.XmlDigester({});
require("date-format-lite");
var util = require('util');
var HTMLDecoderEncoder = require("html-encoder-decoder"), encoded = null;
var ical = require('ical');

function update() {
//        var url = "http://www.google.com/calendar/ical/cocomsp.com_qhpaqd48qabnbg034ghh0c5vs4%40group.calendar.google.com/public/basic.ics";
        var url = "https://www.google.com/calendar/ical/cocomsp.com_qhpaqd48qabnbg034ghh0c5vs4%40group.calendar.google.com/public/full-noattendees.ics?futureevents=true&singleevents=true&orderby=starttime";

        ical.fromURL(url, {}, function(err, data) {
            var array = [];
            var i = 0;
            var today = new Date().setHours(0);
            for (var k in data) {
                if (data.hasOwnProperty(k)) {
                    var ev = data[k];
                    if (ev.type == 'VEVENT' && ev.start > today) {
                        var summary = ev.summary;
                        var start = ev.start;
                        var end = ev.end;
//                        console.log(util.inspect(ev));
                        array[i++] = {summary: summary, start: start, end: end}
                    }
                }
            }

            array.sort(function(a, b) {
                return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
            });

            var rows = [];
            rows[0] = "{o}*************** CoCo Events ***************************************************";

            for (var i = 0; i < 11; i++) {
                var thisEvent = array[i];
                if (thisEvent.start.getHours() == 0) {
                    // This is kinda silly, but if it starts in the first hour of the day we'll assume it's an all day event.
                    rows[i + 1] = thisEvent.start.format("MMM D") + " - " + thisEvent.summary;
                } else {
                    rows[i + 1] = thisEvent.start.format("MMM D at H:mm A") + " - " + thisEvent.summary;
                }
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
        });
}

update();
setInterval(update, 60 * 60 * 1000);
