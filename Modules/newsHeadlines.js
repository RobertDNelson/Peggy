var request = require('request');
var http = require('http');
//var xml_digester = require("xml-digester");
//xml_digester._logger.level(xml_digester._logger.WARN_LEVEL); // stop showing INFO log entries
//var digester = xml_digester.XmlDigester({});

function update() {

    var y = 1;

    var host = 'localhost';

    // display title
    var options = {
        host: host,
        port: 80,
        //port: 8080,
        path: '/peggy/write?board=0&x=1&y=' + y + '&text=HEADLINES',
        agent: false
    };

    http.get(options, function (res) {
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });

    y++;

    var newsFeedUrl = 'http://feeds.reuters.com/reuters/technologyNews?format=xml';
    request(newsFeedUrl, function (err, resp, body) {

        if (!err && resp.statusCode == 200) {
            try {
                // Headlines are all between <title> tags.
                var parser = new DOMParser();
                xmlDoc = parser.parseFromString(body,"text/xml");

                
                var matches = xmlDoc.getElementsByTagName("title");

                var matches = JSON.parse(body);

                for (var i = 0; i < matches.length; i++) {
                    var match = matches[i];

                    var title = math.childNodes[0].nodeValue;
                    

                   
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

                    if(i == 3) break;
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

// update();
// setInterval(update, 1 * 60 * 1000);
