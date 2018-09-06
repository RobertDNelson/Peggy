var request = require('request');
var stripTags = require('striptags');
var http = require('http');
var xml_digester = require('xml-digester');
xml_digester._logger.level(xml_digester._logger.WARN_LEVEL); // stop showing INFO log entries
var digester = xml_digester.XmlDigester({});
require('date-format-lite');
var options = {
    host: '10.1.100.4',
    port: 8080,
    agent: false
};

var wtypes = {
    NONE: 0,
    SUNNY: 1,
    SNOWY: 2,
    RAINY: 3,
    CLOUDY: 4
};
var COLORS = [
    "{g}",
    "{o}",
    "{r}"
];
var wterms = {
    "rain": wtypes.RAINY,
    "hail": wtypes.RAINY,
    "drizzle": wtypes.RAINY,
    "snow": wtypes.SNOWY,
    "sleet": wtypes.SNOWY,
    "overcast": wtypes.CLOUDY,
    "cloud": wtypes.CLOUDY
};
var weather_clear = false,
    weather_type = wtypes.NONE;

var board = { id: 5, 'cols': 32, 'rows': 12, 'right': -1, 'below': -1, 'animStartRow': 4, 'animRowCount': 8 };
var animationBoard = { id: 4, 'cols': 32, 'rows': 12, 'right': -1, 'below': -1, 'animStartRow': 4, 'animRowCount': 8 };

var pix = [];
var pcolor = [];
var x;
var sunBlink = 1;

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
		 writeCell(0,row,'{r}' + period + ' {g}' + temp + PADDING);
		 row++;
		}
		
		// Scrape the humidity.
		var humidityStart = body.indexOf('<b>Humidity</b></td>') + 20;
		var humidityBody = body.substring(humidityStart,body.length).trim();
		var humidityEnd = humidityBody.indexOf('</td>'); // next </td> should be the end of the humidity value.
		humidityBody = humidityBody.substring(0,humidityEnd);
		humidityBody = stripTags(humidityBody);
		writeCell(0,3,'Humidity: ' + humidityBody +  PADDING);
		
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
            var wt = wtypes.SUNNY, wlc = weather.toLowerCase();
            for (var w in wterms) {
                if (wlc.indexOf(w) >= 0) {
                    wt = wterms[w];
                    break;
                }
            }
            if (wt != weather_type) weather_clear = true;
            weather_type = wt;
            // weather_type = wtypes.SNOWY;

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
        case wtypes.CLOUDY:
        case wtypes.SUNNY:
            sunAndClouds();
            break;
        case wtypes.RAINY:
        case wtypes.SNOWY:
            snowAndRain();
            break;
    }
}

function sunAndClouds() {
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
        var writeLines, writeColor;

        if (weather_type == wtypes.CLOUDY) {
            writeColor = '{g}';
            writeLines = [
                " ,----------,   ",
                "(            )  ",
                " (   (  )     ) ",
                "  (         )   ",
                "   `-------`    "
            ];
        } else if (sunBlink == 0) {
            writeColor = '{o}';
            writeLines = [
                "   "+b3+"   ",
                "- " +b5+ " -",
                "   "+b3+"   ",
                "    .    "
            ];
        } else if (sunBlink == 1) {
            writeColor = '{o}';
            writeLines = [
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
    var clear = [];
    // move all current pix down by 1
    for (x=0; x<animationBoard.cols; x++) {
        if (pix[x] >= 0) {
            pix[x]++;
            if (pix[x] >= animationBoard.rows) {
                pix[x] = -1;
                clear[x] = true;
            }
        }
    }

    // should we add a new pix?
    if (Math.random() < 0.9) {
        // find an open spot
        var col = getOpenCol();
        if (col >= 0) {
            pix[col] = animationBoard.animStartRow;
            pcolor[col] = getRandColor();
        }
    }

    // rain or snow?
    var cChar = (weather_type == wtypes.RAINY) ? '!' : '*';
    var bRain = (weather_type == wtypes.RAINY);

    // draw all relevant rows
    for (var y=animationBoard.animStartRow, yMax=animationBoard.animStartRow+animationBoard.animRowCount; y<yMax; y++) {
        if (pix.indexOf(y) || pix.indexOf(y-1)) {
            // we have SOMETHING to write here - pixel or space
            var line = "", write = false;
            for (x=0; x<animationBoard.cols; x++) {
                if (pix[x] == y+1) {
                    line += " ";
                    write = true;
                } else if (pix[x] == y) {
                    line += pcolor[x] + cChar;
                    write = true;
                } else if (y == animationBoard.rows - 1 && clear[x]) {
                    line += " ";
                    write = true;
                    clear[x] = false;
                } else {
                    line += " ";
                }
            }
            if (write) {
                // console.log("Write line " + y + ": \"" + line + "\"");
                options.path = "/peggy/write?board=" + animationBoard.id + "&x=0&y=" + y + "&text=" + encodeURIComponent(line);
                http.get(options).on('error', simpleLogError);
            }
        }
    }
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
    for (var i=0; i<10; i++) { // try 10 times
        var col = Math.floor(Math.random()*board.cols);
        if (pix[col] == -1) {
            return col;
        }
    }
    return -1;
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
setInterval(drawWeather, 1000); // 1 second
