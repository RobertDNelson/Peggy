var http = require('http');
var dateFormat = require("date-format-lite");
var google = require('googleapis');
var calendar = google.calendar('v3');

var defaultParams = {
  calendarId: process.env.CALENDAR_ID,
  orderBy: 'startTime',
  singleEvents: true,
  maxResults: 11,
  fields: 'items(summary,start)',
  key: process.env.CALENDAR_KEY
}

function update() {
  var date = new Date();
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);

  var p = JSON.parse(JSON.stringify(defaultParams));
  p['timeMin'] = date.toISOString();

  calendar.events.list(p,function (err, response) {
    if(!err) {
      var rows = [];
      rows[0] = "{o} ******************************* Fueled Collective Events *********************";

      var events = response.items;

      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        
        var dateString = "";

        if (e.start.dateTime) {
          var eDate = new Date(e.start.dateTime);

          var prettyHourString = eDate.format("HH");
          prettyHourString = prettyHourString.replace(/0(\d)/g, " $1");

          var prettyDayString = eDate.format("DD");
          prettyDayString = prettyDayString.replace(/0(\d)/g, " $1");

          dateString = eDate.format("MMM " + prettyDayString + " " + prettyHourString + ":mmA");
        } else if (e.start.date) {
          var parts = e.start.date.split("-");
          var eDate = new Date(parts[0],parts[1]-1,parts[2]);

          var prettyDayString = eDate.format("DD");
          prettyDayString = prettyDayString.replace(/0(\d)/g, " $1");

          dateString = eDate.format("MMM " + prettyDayString + "        ");
        }

        rows[i + 1] = dateString + " - " + e.summary;
      }

      for (var i = 0; i < 12; i++) {
        var options = {
          host: "localhost", // 10.105.4.251
          port: 8080,
          path: "/peggy/write?board=2&x=0&y=" + i + "&text=" + encodeURIComponent(rows[i] + "                                                            "),
          agent: false
        }

        console.log(rows[i]);
        http.get(options, function(res) {}).on('error', function(e) {
          console.log("Got error: " + e.message);
        });
      }
    } else {
      console.log('Events Error', err);
    }
  });
}

update();
setInterval(update, 60 * 60 * 1000);
