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

var PADDING = '                    ';

function update() {

    var formattedDate = 'Unknown';
    try {
        formattedDate = new Date().format('DDDD, MMMM D H:mm A');
    } catch (e) {
        console.log('Unable to format date: ' + e);
    }

    options.path = '/peggy/write?board=4&x=1&y=0&text=' + encodeURIComponent(formattedDate + PADDING);
    http.get(options).on('error', function (e) {
        e = e || {};
        console.log('Got error: ' + e.message);
    });

    request('http://www.weather.gov/xml/current_obs/KMSP.xml', function (err, resp, body) {

        if (err) {
            console.log('Failed request to get weather: ' + err);
            return;
        }

        digester.digest(body, function (err, result) {

            if (err) {
                console.log('Failed to parse XML: ' + err);
                return;
            }

            result = result || {};
            var observation = result.current_observation || {};
            var weather = observation.weather || {};
            var temperature = observation.temperature_string || '';
            var wind = observation.wind_string || '';

            options.path = '/peggy/write?board=4&x=3&y=1&text=' + encodeURIComponent(weather + PADDING);
            http.get(options).on('error', function (e) {
                e = e || {};
                console.log('Got error: ' + e.message);
            });

            options.path = '/peggy/write?board=4&x=3&y=2&text=' + encodeURIComponent('Temperature: ' + temperature + PADDING);
            http.get(options).on('error', function (e) {
                e = e || {};
                console.log('Got error: ' + e.message);
            });

            options.path = '/peggy/write?board=4&x=3&y=3&text=' + encodeURIComponent('Wind: ' + wind + PADDING);
            http.get(options).on('error', function (e) {
                e = e || {};
                console.log('Got error: ' + e.message);
            });
        });
    });
}

update();
setInterval(update, 60 * 1000);
