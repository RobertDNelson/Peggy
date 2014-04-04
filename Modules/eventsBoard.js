var request = require('request');
var http = require('http');
var xml_digester = require("xml-digester");
var digester = xml_digester.XmlDigester({});
require("date-format-lite");
var util = require('util');
var HTMLDecoderEncoder = require("html-encoder-decoder"), encoded = null;
var ical = require('ical');

function update() {
        var url = "http://www.google.com/calendar/ical/events@cocomsp.com/public/basic.ics";

        ical.fromURL(url, {}, function(err, data) {
            var array = [];
            var i = 0;
            var today = new Date();
            var yesterday = today.setDate(today.getDate() - 1);
            for (var k in data) {
                if (data.hasOwnProperty(k)) {
                    var ev = data[k];
                    if (ev.type == 'VEVENT' && ev.start > yesterday) {
                        var summary = ev.summary;
                        var start = ev.start;
                        array[i++] = {summary: summary, start: start}
                    }
                }
            }

            array.sort(function(a, b) {
                return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
            });

            var rows = [];
            rows[0] = "{o}*************** CoCo Events ***************************************************";

            for (var i = 0; i < 11; i++) {
                rows[i + 1] = array[i].start.format("M/D/YY H:mm A") + " - " + array[i].summary;
            }

            for (var i = 0; i < 11; i++) {

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
