var request = require('request');
var domParser = require('jsdom');
var stripTags = require('striptags');
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

var wtypes = {
    NONE: 0,
    SUNNY: 1,
    SNOWY: 2,
    RAINY: 3,
    CLOUDY: 4,
    FOGGY: 5
};
var wseverity = {
    LIGHT: 0,
    NORMAL: 1,
    SEVERE: 2
};
var COLORS = [
    "{g}",
    "{o}",
    "{r}"
];
var wterms = { // these are purposefully NOT grouped by type - the terms are searched in order, and precedence is by design
    "rain": [wtypes.RAINY, wseverity.NORMAL],
    "hail": [wtypes.RAINY, wseverity.NORMAL],
    "drizzle": [wtypes.RAINY, wseverity.LIGHT],
    "snow": [wtypes.SNOWY, wseverity.NORMAL],
    "sleet": [wtypes.SNOWY, wseverity.NORMAL],
    "overcast": [wtypes.CLOUDY, wseverity.SEVERE],
    "mostly cloud": [wtypes.CLOUDY, wseverity.SEVERE],
    "partly cloud": [wtypes.CLOUDY, wseverity.LIGHT],
    "mostly sun": [wtypes.CLOUDY, wseverity.LIGHT],
    "cloud": [wtypes.CLOUDY, wseverity.NORMAL],
    "thunderstorm": [wtypes.RAINY, wseverity.SEVERE],
    "fog": [wtypes.FOGGY, wseverity.NORMAL],
    "fair": [wtypes.SUNNY, wseverity.NORMAL],
    "sun": [wtypes.SUNNY, wseverity.NORMAL]
};
var weather_clear = false,
    weather_type = wtypes.NONE,
    weather_severity = wtypes.NORMAL;

var board = { id: 5, 'cols': 32, 'rows': 12, 'right': -1, 'below': -1, 'animStartRow': 1, 'animRowCount': 11 };
var animationBoard = { id: 4, 'cols': 32, 'rows': 12, 'right': -1, 'below': -1, 'animStartRow': 1, 'animRowCount': 11 };

var pix = [];
var pixCols = [];
var x;
var sunBlink = 1;
var cloudShift = 0;
var fogDrawn = false;

var PADDING = '                              ';

function simpleLogError(e) {
    e = e || {};
    console.log('Got error: ' + e.message);
}

function updateTime() {

    var formattedDate = 'Unknown';
    try {
        formattedDate = new Date().format('DDDD, MMMM D H:mm A');
    } catch (e) {
        console.log('Unable to format date: ' + e);
    }
	
    writeCell(1, 0, formattedDate + PADDING,animationBoard.id);
}
// Store grid endpoint for forecasts
var forecastGridpoint = null;

// Get grid endpoint for the location
function getGridpoint() {
    var opts = {
        url: 'https://api.weather.gov/points/44.979,-93.2649',
        headers: {
            'User-Agent': '(Peggy Weather Display, farts@farts.com)',
            'Accept': 'application/json'
        },
        json: true
    };
    
    request(opts, function (err, resp, body) {
        if (err) {
            console.log('Failed to get gridpoint: ' + err);
            return;
        }
        
        try {
            forecastGridpoint = body.properties.forecast;
            // Now get the forecast
            getForecast();
        } catch (e) {
            console.log('Failed to parse gridpoint data: ' + e);
        }
    });
}

function getForecast() {
    if (!forecastGridpoint) {
        getGridpoint();
        return;
    }
    
	var opts = {
        url: forecastGridpoint,
        headers: {
            'User-Agent': '(Peggy Weather Display, farts@farts.com)',
            'Accept': 'application/json'
        },
        json: true
    };
	
	request(opts, function (err, resp, body) {
		
        if (err) {
            console.log('Failed request to get forecast: ' + err);
            return;
        }
        
        try {
            var periods = body.properties.periods || [];
            
            // The row we want to start printing forecasts for.
            var row = 5;
            var dayCount = 0;
            
            // Go through each forecast period
            for (var i = 0; i < periods.length && dayCount < 7; i++) {
                var period = periods[i];
                
                // Only want daytime forecasts for display
                if (!period.isDaytime) continue;
                
                var name = period.name;
                var temp = period.temperature + '°F';
                var shortForecast = period.shortForecast;
                
                // Combine temperature and short forecast
                var forecast = shortForecast + ' ' + temp;
                
                writeCell(0, row, '{r}' + name + ' {g}' + forecast + PADDING);
                row++;
                dayCount++;
            }
        } catch (e) {
            console.log('Failed to parse forecast data: ' + e);
        }
    });
}

function getWeather() {

    var opts = {
        url: 'https://api.weather.gov/stations/KMSP/observations/latest',
        headers: {
            'User-Agent': '(Peggy Weather Display, contact@example.com)',
            'Accept': 'application/json'
        },
        json: true
    };

    request(opts, function (err, resp, body) {
		
        if (err) {
            console.log('Failed request to get weather: ' + err);
            return;
        }

        try {
            var properties = body.properties || {};
            var weather = properties.textDescription || '';
            var temperature = properties.temperature || {};
            var wind = properties.windSpeed || {};
            var windDirection = properties.windDirection || {};
            var humidity = properties.relativeHumidity || {};
            
            // Format temperature (convert from Celsius to Fahrenheit)
            var tempValue = temperature.value;
            if (tempValue !== null && temperature.unitCode === 'wmoUnit:degC') {
                tempValue = (tempValue * 9/5) + 32;
            }
            var temperatureString = tempValue ? Math.round(tempValue) + 'F' : 'N/A';
            
            // Format wind
            var windString = '';
            if (wind.value !== null) {
                var windMph = wind.value;
                if (wind.unitCode === 'wmoUnit:km_h-1') {
                    windMph = wind.value * 0.621371; // Convert km/h to mph
                }
                windMph = Math.round(windMph);
                
                var direction = '';
                if (windDirection.value !== null) {
                    var deg = windDirection.value;
                    var directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
                    direction = directions[Math.round(deg / 22.5) % 16];
                }
                
                if (windMph === 0) {
                    windString = 'Calm';
                } else {
                    windString = direction + ' at ' + windMph + ' MPH';
                }
            }
            
            // Update humidity if available
            if (humidity.value !== null) {
                var humidityString = Math.round(humidity.value) + '%';
                writeCell(0, 3, 'Humidity: ' + humidityString + PADDING);
            }
			
            // update the weather type
            var wt = wtypes.SUNNY, ws = wseverity.NORMAL, wlc = weather.toLowerCase();
            for (var w in wterms) {
                if (wlc.indexOf(w) >= 0) {
                    wt = wterms[w][0];
                    ws = wterms[w][1];
                    break;
                }
            }
            if (wt != weather_type || ws != weather_severity) weather_clear = true;
            weather_type = wt;
            weather_severity = ws;

            // override
            // weather_type = wtypes.SUNNY;
            // weather_severity = wseverity.LIGHT;

            // update the board
			writeCell(0, 0,'{r}********* Weather *****************************');
            writeCell(0, 1,  weather + ' ' + temperatureString +PADDING);
            writeCell(0, 2, 'Wind: ' + windString + PADDING);
			writeCell(0, 4, PADDING);
        } catch (e) {
            console.log('Failed to parse weather data: ' + e);
        }
    });
}

function drawWeather() {
    if (weather_clear) {
        weather_clear = false;
        clearAnimation();
    }

    switch (weather_type) {
        case wtypes.NONE:
            return;
        case wtypes.FOGGY:
        case wtypes.CLOUDY:
            clouds();
            break;
        case wtypes.SUNNY:
            sun();
            break;
        case wtypes.RAINY:
        case wtypes.SNOWY:
            snowAndRain();
            break;
    }
}

function clouds() {
    var desiredDuration = 32 // roughly every 5 minutes
        shiftEveryN = Math.round(desiredDuration/board.cols),
        fullDuration = shiftEveryN * board.cols;

    if (cloudShift % shiftEveryN == 0) {
        var writeLines, writeColor = '{g}'

        if (weather_type == wtypes.FOGGY) {
            writeLines = [
                "   )   ,----------,      (      ",
                "--`   (            )      `-----",
                " ,-----(   (  )     )----,   ( )",
                "(       (         )       )     ",
                " (       `-------`  ( ),----,   ",
                "  `-----`      (      (      )  ",
                "--, )   (  ,----,     (  ( )  )-",
                "   )     `(      )---' `-----`  ",
                " )  )    (        )        (   (",
                "   )      `------`    ( )   (   ",
                "--` `------`   (             `--"
            ];
        } else if (weather_severity == wseverity.LIGHT) {
            writeLines = [
                "       ,----------,             ",
                "      (            )            ",
                "       (   (  )     )           ",
                "        (         )             ",
                "         `-------`              ",
                "                                ",
                "                                ",
                "                                ",
                "                                ",
                "                                ",
                "                                "
            ];
        } else if (weather_severity == wseverity.SEVERE) {
            writeLines = [
                "       ,----------,             ",
                "      (            )            ",
                " ,-----(   (  )     )----,      ",
                "(       (         )       )     ",
                " (       `-------`  ( ),----,   ",
                "  `-----`      (      (      )  ",
                "--,        ,----,     (  ( )  )-",
                "   )      (      )---' `-----`  ",
                " )  )    (        )        (   (",
                "   )      `------`          (   ",
                "--`                          `--"
            ];
        } else { // NORMAL
            writeLines = [
                "       ,----------,             ",
                "      (            )            ",
                " ,-----(   (  )     )           ",
                "(       (         )             ",
                " (       `-------`     ,----,   ",
                "  `-----`             (      )  ",
                "           ,----,     (  ( )  ) ",
                "          (      )     `-----`  ",
                "         (        )             ",
                "          `------`              ",
                "                                "
            ];
        }

        var pos = changeRange(0, fullDuration, cloudShift, 0, board.cols, true, false);
        // var pad = (pos > 0) ? repeatString(" ", pos) : "";
        // console.log("clouds() pos = " + pos + ", cloudShift = " + cloudShift);

        function moveWriteCell(x, y, color, line) {
            if (pos < 0) pos += board.cols;
            var msg = color + shiftWrapText(line, " ", pos, board.cols);
            writeCell(x, y, msg, animationBoard.id);
        }
        
        for (var i=0; i<writeLines.length; i++) {
            moveWriteCell(0, i+animationBoard.animStartRow, writeColor, writeLines[i]);
        }
    }

    cloudShift++;
    if (cloudShift >= fullDuration) cloudShift = 0;
}

function sun() {
    // get sun position
    var d = new Date(),
        h = d.getHours() + (d.getMinutes() / 60);
    // TODO: get actual sunrise & sunset times (weather module's KMSP.xml feed doesn't contain this, but this seems valid: http://www.srh.noaa.gov/data/MPX/CLIMSP)

    var sunWidth = 10,
        sunrise = 7,
        sunset = 19,
        pos = changeRange(sunrise, sunset, h, 0-(sunWidth/2), board.cols-(sunWidth/2), true, false);
    
    var pad = (pos > 0) ? repeatString(" ", pos) : "";

    // console.log("Hours = " + h + ", Pos = " + pos);

    function moveWriteCell(x, y, color, line) {
        if (pos < 0) line = line.substr(pos * -1);
        var msg = pad + color + line;
		
        writeCell(x, y, msg,animationBoard.id);
    }

    if (sunBlink <= 1) {
        // only redraw when the sun is blinking on or off

        // super simple sun
        var b7 = repeatString(String.fromCharCode(127), 7);
        var b5 = repeatString(String.fromCharCode(127), 5);
        var b3 = repeatString(String.fromCharCode(127), 3);
        var writeLines, writeColor = '{o}';

        if (sunBlink == 0) {
            writeLines = [
                "    .    ",
                "   "+b3+"   ",
                "- " +b5+ " -",
                "   "+b3+"   ",
                "    .    "
            ];
        } else if (sunBlink == 1) {
            writeLines = [
                "         ",
                "   "+b3+"    ",
                "  " +b5+ "   ",
                "   "+b3+"    ",
                "         "
            ];
        }

        for (var i=0; i<writeLines.length; i++) {
            moveWriteCell(0, i+animationBoard.animStartRow, writeColor, writeLines[i]);
        }
    }

    sunBlink++;
    if (sunBlink >= 3) sunBlink = 0;
}

function snowAndRain() {
    var grid = []; // 2-dimensional grid of current pix objects
    var p, i;

    // make sure grid has an entry for each row
    for (i=0; i<animationBoard.rows; i++) {
        grid[i] = [];
    }

    // move all current pix down by 1
    for (i=0; i<pix.length; /* no increment*/) {
        p = pix[i];
        p.y++;
        if (p.y >= animationBoard.rows) {
            pix.splice(i,1);
        } else { // we're drawing this one
            grid[p.y][p.x] = p;
            i++;
        }
    }

    // add threshold
    var at = 0, num = 1;
    if (weather_severity == wseverity.SEVERE) {
        at = 0.8;
        num = 10;
    } else if (weather_severity == wseverity.LIGHT) {
        at = 0.5;
    } else { // NORMAL
        at = 0.8;
        num = 2;
    }

    // should we add a new pix?
    pixCols = []; // reset
    for (var times=0; times<num; times++) {
        if (at >= 1 || Math.random() < at) {
            // find an open spot
            var col = getOpenCol();
            if (col >= 0) {
                p = {
                    x: col,
                    y: animationBoard.animStartRow,
                    c: getRandColor(),
                    s: (weather_type == wtypes.RAINY) ? '!' : '*'
                };
                pix.push(p);
                grid[p.y][p.x] = p; // add to grid for immediate drawing
            }
        }
    }

    // console.log("tracking " + pix.length + " pix");

    // draw all relevant rows
    for (var y=animationBoard.animStartRow, yMax=animationBoard.animStartRow+animationBoard.animRowCount; y<yMax; y++) {
        if (grid[y].length == 0) {
            // we have a blank row, short-circuit!
            line = repeatString(" ", animationBoard.cols);
        } else {
            // we need to draw
            line = "";
            for (var x=0; x<animationBoard.cols; x++) {
                if (grid[y][x] === undefined) {
                    line += " ";
                } else {
                    // we have a pix!
                    line += grid[y][x].c + grid[y][x].s;
                }
            }
        }

        options.path = "/peggy/write?board=" + animationBoard.id + "&x=0&y=" + y + "&text=" + encodeURIComponent(line);
        http.get(options).on('error', simpleLogError);
    }
}

function shiftWrapText(text, pad, shift, max) {
    var len = text.length;
    // ensure we have max # of chars, padding at end
    if (len > max) {
        text = substr(0, max);
    } else if (len < max) {
        text += repeatString(pad, max - len);
    }
    // shift and wrap
    return text.substr(-shift) + text.substr(0, max-shift);
}

function repeatString(str, num) {
    return new Array( num + 1 ).join( str );
}

function writeCell(x, y, msg,boardId) {
	if(boardId == null){
		boardId = board.id
	}
    options.path = "/peggy/write?board=" + boardId + "&x=" + x + "&y=" + y + "&text=" + encodeURIComponent(msg);
    http.get(options).on('error', simpleLogError);
}

function getOpenCol() {
    // get array of open columns
    var o = [];
    for (var c=0; c<animationBoard.cols; c++) {
        if (pixCols[c] === undefined) o.push(c);
    }
    // if nothing available, return -1
    if (o.length == 0) return -1;
    // randomly select one of these columns
    var pos = Math.floor(Math.random() * o.length);
    // console.log("getOpenCol selects index=" + pos + ", column=" + o[pos]);
    pixCols[o[pos]] = 1;
    return o[pos];
}

function getRandColor() {
    var c = Math.floor(Math.random()*3);
    return COLORS[c];
}

function changeRange(inMin, inMax, value, outMin, outMax, bRound, bClip) {
    var p = (value - inMin) / (inMax - inMin) * 1.0;
    var n = p * (outMax - outMin) + outMin;
    // console.log("value = " + value + ", p = " + p + ", n = " + n + " [" + inMin + "-" + inMax + "] -> [" + outMin + "-" + outMax + "]");
    if (bRound) {
        n = Math.round(n);
    }
    if (bClip) {
        n = Math.min(outMax, Math.max(outMin, n));
    }
    return n;
}
function clearBoard(boardId){
	 options.path = "/peggy/clear?board=" + boardId;
    http.get(options).on('error', simpleLogError);
}

function clearAnimation() {
    fogDrawn = false;
    var line = repeatString(" ", animationBoard.cols);
    for (var y=animationBoard.animStartRow, yMax=animationBoard.animStartRow+animationBoard.animRowCount; y<yMax; y++) {
        writeCell(0, y, line,animationBoard.id);
    }
}
clearBoard(4);
clearBoard(5);
updateTime();
getWeather();
getGridpoint(); // This will call getForecast after getting the gridpoint
setInterval(updateTime, 10 * 1000); // 10 seconds
setInterval(getWeather, 1000 * 60 * 5); // 5 minutes
setInterval(getForecast, 1000 * 60 * 5); // 5 minutes
setInterval(drawWeather, 4000); // increased from 1 second to share redraws a bit more
