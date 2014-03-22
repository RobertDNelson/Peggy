var request = require('request');
var http = require('http');
var xml_digester = require("xml-digester");
var digester = xml_digester.XmlDigester({});

module.exports = function () {
    var TimeAndWeather = {};

    TimeAndWeather.execute = function() {

        var maxCharsPerRow = 32;
        var weatherFeedUrl = 'http://www.weather.gov/xml/current_obs/KMSP.xml';

        request(weatherFeedUrl, function(err, resp, body)
        {
            digester.digest(body, function(err, result) {

                var options = {
                    host: 'localhost',
                    port: 8080,
                    path: '/peggy/write?x=1&y=1&text=' + encodeURIComponent(result.current_observation.weather)
                };

                http.get(options, function(res) {
                        console.log("Got response: " + res.statusCode);
                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                    });

                options = {
                    host: 'localhost',
                    port: 8080,
                    path: '/peggy/write?x=1&y=1&text=' + encodeURIComponent('Temperature: ' + result.current_observation.temperature_string)
                }

                http.get(options, function(res) {
                        console.log("Got response: " + res.statusCode);
                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                    });

                options = {
                    host: 'localhost',
                    port: 8080,
                    path: '/peggy/write?x=1&y=1&text=' + encodeURIComponent('Wind: ' + result.current_observation.wind_string)
                };

                http.get(options, function(res) {
                        console.log("Got response: " + res.statusCode);
                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                    });
            });
        });
    }

    return TimeAndWeather;
}();