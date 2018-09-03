var request = require('request');
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
function getForecast() {
	var opts = {
        url: 'https://forecast.weather.gov/MapClick.php?lat=44.979&lon=-93.2649',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.245'
        }
    };
	
	request(opts, function (err, resp, body) {
		
        if (err) {
            console.log('Failed request to get weather: ' + err);
            return;
        }
		/* This gets detailed forecasts.  Too much for the small board, but leaving to not lose the work.
		var detailedForecastBodyStart = body.indexOf('id="detailed-forecast-body">') + 28;
		var detailedForecastBodyEnd = body.indexOf('<!-- /Detailed Forecast -->');
		var detailedForecastBody = body.substring(detailedForecastBodyStart,detailedForecastBodyEnd);
		var nextForecastTimeStart = detailedForecastBody.indexOf('<div class="col-sm-2 forecast-label"><b>') + 40;
		var nextForecastTimeEnd = detailedForecastBody.indexOf('</b>');
		var nextForecastTime = detailedForecastBody.substring(nextForecastTimeStart,nextForecastTimeEnd);
		var forecastStart = detailedForecastBody.indexOf('</b></div><div class="col-sm-10 forecast-text">') + 47;
		var forecastEnd = detailedForecastBody.indexOf('</div></div><div class="row row-even row-forecast">');
		var forecast = detailedForecastBody.substring(forecastStart,forecastEnd);
		// Need to wrap the forecast.
		var forecast2 = '';
		var forecast3 = '';
		if(forecast.length > board.cols){
			forecast2 = forecast.substring(board.cols,forecast.length);
		}
		if(forecast2.length > board.cols){
			forecast3 = forecast2.substring(board.cols,forecast2.length);
		}
		
		// update the board
		//writeCell(0, 9, nextForecastTime + ':' + PADDING);
		//writeCell(0, 10, forecast + PADDING);
		//writeCell(0, 11, forecast2 + PADDING);
		*/
		
		// Short forecasts.  We are scraping from HTML so this is messy, but seems to work.  
		
		// Find the start of the <ul> that has all the forecast data in it.
		var sevenDayForecastStart = body.indexOf('<ul id="seven-day-forecast-list" class="list-unstyled">') + 57;
		var sevenDayForecastBody = body.substring(sevenDayForecastStart,body.length);
		var sevenDayForecastEnd = sevenDayForecastBody.indexOf('</ul>');
		
		sevenDayForecastBody = sevenDayForecastBody.substring(0,sevenDayForecastEnd);
		// Each forecast blurb is in a 'tombstone-container' element pretty predictably.
		var forecasts = sevenDayForecastBody.split('<div class="tombstone-container">');
		// The row we want to start printing forecasts for.
		var row = 5;
		// Go through each of our forecasts and 
		for(var i=0;i<forecasts.length;i++){
		 var forecast = forecasts[i];
		 // Find the period of the forecast - 'Today', 'Sunday' Tonight, etc.
		 var periodStart = forecast.indexOf('<p class="period-name">') + 23;
		 var periodEnd = forecast.indexOf('</p>');
		 if(periodEnd== -1) continue; // This happens if there is garbage at the start of our parsing.
		 var period = forecast.substring(periodStart,periodEnd);
		 period = stripTags(period,[],' ').trim();
		 
		 // Only want full day forecasts, throw out the evening forecasts.
		 if(period.indexOf('Night') != -1) continue;
		 var tempStart = forecast.indexOf('<p class="short-desc">') + 22;// Have to make this pretty: Partly Sunny</p><p class="temp temp-high">High: 72 &deg;F</p>
		 // Cut off the html code for degrees F
		 var tempEnd = forecast.indexOf('&deg;F</p>');
		 var temp = forecast.substring(tempStart,tempEnd);
		 // Get rid of the 'high' and 'low' labels to save space.
		 temp = temp.replace('High: ','');
		 temp = temp.replace('Low: ','');
		 // Re-add the label we threw out a few lines ago.
		 temp = temp.trim() + 'F';
		 // get rid of HTML tags and extra spaces.
		 temp = stripTags(temp,[],' ');
		 temp = temp.replace('  ',' ');
		 writeCell(0,row,'{r}' + period + ' {g}' + temp);
		 row++;
		}
		
		// Scrape the humidity.
		var humidityStart = body.indexOf('<b>Humidity</b></td>') + 20;
		var humidityBody = body.substring(humidityStart,body.length).trim();
		var humidityEnd = humidityBody.indexOf('</td>'); // next </td> should be the end of the humidity value.
		humidityBody = humidityBody.substring(0,humidityEnd);
		humidityBody = stripTags(humidityBody);
		writeCell(0,3,'Humidity: ' + humidityBody);
		
    });
}

function getWeather() {

    var opts = {
        url: 'http://w1.weather.gov/xml/current_obs/KMSP.xml',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.245'
        }
    };

    request(opts, function (err, resp, body) {
		
        if (err) {
            console.log('Failed request to get weather: ' + err);
            return;
        }

        // remove any XML directives
        // body = body.replace(/\<\?xml.*?\?\>/gi, "");

        digester.digest(body, function (err, result) {

            if (err) {
                console.log('Failed to parse XML: ' + err);
                // console.log('Full XML:');
                // console.log(body);
                return;
            }

            result = result || {};
            var observation = result.current_observation || {};
            var weather = observation.weather || {};
            var temperature = observation.temperature_string || '';
			
			// Remove celcius and tenths from the temp to save space and remove info people likely aren't using.
			var tempDecimalStart = temperature.indexOf('.');
			if(tempDecimalStart > 0){
				temperature = temperature.substring(0,tempDecimalStart) + 'F';
			}
			
            var wind = observation.wind_string || '';
			// Remove the wind speed in knots; it doesn't fit on the board and no one cares.
			var knotsStart = wind.indexOf(' (');
			if(knotsStart > 0){
				wind = wind.substring(0,knotsStart);
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
            // weather_type = wtypes.RAINY;
            // weather_severity = wseverity.LIGHT;

            // update the board
			writeCell(0, 0,'{r}********* Weather *****************************');
            writeCell(0, 1,  weather + ' ' + temperature +PADDING);
            writeCell(0, 2, 'Wind: ' + wind + PADDING);
			writeCell(0, 4, PADDING);
        });
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
    if (sunBlink >= 5) sunBlink = 0;
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
getForecast();
setInterval(updateTime, 10 * 1000); // 10 seconds
setInterval(getWeather, 1000 * 60 * 1); // 5 minutes
setInterval(getForecast, 1000 * 60 * 1); // 5 minutes
setInterval(drawWeather, 1500); // increased from 1 second to share redraws a bit more
