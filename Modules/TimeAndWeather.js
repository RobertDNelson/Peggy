var request = require('request');
var http = require('http');
var xml_digester = require("xml-digester");
var digester = xml_digester.XmlDigester({});
require("date-format-lite");

module.exports = function () {
    var TimeAndWeather = {};

    TimeAndWeather.execute = function() {
        setInterval(TimeAndWeather.execute, 60000);

        var maxCharsPerRow = 32;
        var weatherFeedUrl = 'http://www.weather.gov/xml/current_obs/KMSP.xml';
        var options = {
                host: 'localhost',
                port: 8080,
                path: '/peggy/write?board=4&x=1&y=0&text=' + encodeURIComponent(new Date().format('DDDD, MMMM D H:mm A'))
            };

        http.get(options, function(res) {
            }).on('error', function(e) {
                console.log("Got error: " + e.message);
            });

        request(weatherFeedUrl, function(err, resp, body) {
            digester.digest(body, function(err, result) {

                var options = {
                    host: 'localhost',
                    port: 8080,
                    path: '/peggy/write?board=4&x=3&y=1&text=' + encodeURIComponent(result.current_observation.weather)
                };

                http.get(options, function(res) {

                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                    });

                options = {
                    host: 'localhost',
                    port: 8080,
                    path: '/peggy/write?board=4&x=3&y=2&text=' + encodeURIComponent('Temperature: ' + result.current_observation.temperature_string)
                }

                http.get(options, function(res) {
                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                    });

                options = {
                    host: 'localhost',
                    port: 8080,
                    path: '/peggy/write?board=4&x=3&y=3&text=' + encodeURIComponent('Wind: ' + result.current_observation.wind_string)
                };

                http.get(options, function(res) {
                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                    });
            });
        });
    }

    return TimeAndWeather;
}();