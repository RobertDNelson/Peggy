var MessageRequest = require('../models/message_request.js');

module.exports = function () {
  var DevBoard;

  DevBoard = function () {
    var BOARDS = {
        '0': { 'cols': 80, 'rows': 12, 'right': 1, 'below': 2, 'pegml': [], 'html': '' },
        '1': { 'cols': 80, 'rows': 12, 'right': 4, 'below': 3, 'pegml': [], 'html': '' },
        '4': { 'cols': 32, 'rows': 12, 'right': -1, 'below': 5, 'pegml': [], 'html': '' },

        '2': { 'cols': 80, 'rows': 12, 'right': 3, 'below': -1, 'pegml': [], 'html': '' },
        '3': { 'cols': 80, 'rows': 12, 'right': 5, 'below': -1, 'pegml': [], 'html': '' },
        '5': { 'cols': 32, 'rows': 12, 'right': -1, 'below': -1, 'pegml': [], 'html': '' },

        '6': { 'cols': 80, 'rows': 10, 'right': -1, 'below': -1, 'pegml': [], 'html': '' },
      };

    var allowWrites = true;

    /**
     * Replaces the color placeholders with the required control characters. Those characters are used by the
     * board to color the subsequent characters
     * @param message
     * @returns {String} The properly formated string
     */
    function replaceColorPlaceholders(message) {
      message = message.replace(/\{g\}/g, String.fromCharCode(29)); // Green
      message = message.replace(/\{r\}/g, String.fromCharCode(30)); // Red
      message = message.replace(/\{o\}/g, String.fromCharCode(31)); // Orange
      return message;
    }

    function asciiLength(message) {
      return message.replace(/\{\w\}/g, "").length;
    }

    /**
     * Replaces the characters with escaped characters.
     * @param message
     * @returns {String} The escaped string
     */
    function escapeCharacters(message) {
      message = message.replace(/\[/g, '(');
      message = message.replace(/\//g, '/');
      message = message.replace(/\]/g, ')');
      message = message.replace(/\^/g, '-');
      message = message.replace(/_/g, '\-');
      message = message.replace(/`/g, '\'');
      message = message.replace(/\{/g, '(');
      message = message.replace(/\|/g, '1');
      message = message.replace(/\}/g, ')');
      message = message.replace(/~/g, '-');
      message = message.replace(/–/g, '-');
      return message;
    }

    // [ {r}Hello                       ]
    //     -->    World   <-- (starts at x=7)
    function asciiXtoPegmlX(message, x) {
      var pegmlX = 0;
      var countX = 0;
      var maxLen = message.length;
      while (countX < x && pegmlX < maxLen) {
        if (message.charAt(pegmlX) == "{") {
          pegmlX += 4; // count the {o} color + the character on which it starts
        } else {
          pegmlX++;
        }
        countX++;
      }
      // console.log("x=" + x + ", pegmlX=" + pegmlX + ", message=[" + message + "]");
      return pegmlX;
    }

    function pegmlToHtml(message) {
      message = message.replace(/\{g\}/g, '</span><span class="color-g">');
      message = message.replace(/\{o\}/g, '</span><span class="color-o">');
      message = message.replace(/\{r\}/g, '</span><span class="color-r">');
      return '<span class="color-g">' + message + '</span>';
    }


    return {
      connect: function() {
        console.log("DevBoard.connect");
      },
      /**
       * @param {MessageRequest} req
       */
      write: function (req) {
        if (allowWrites) {
          // console.log("DevBoard.write:");
          // console.log(req);
          var board = BOARDS[req.board.toString()];
          var curPegml = board.pegml[req.y] || "";

          var pegmlX = asciiXtoPegmlX(curPegml, req.x);
          var pegmlChars = asciiLength(req.text);
          var pegmlEndX = asciiXtoPegmlX(curPegml, req.x + pegmlChars);

          // temp write
          // console.log("WANT: [" + req.text + "] at x=" + req.x + ", length=" + pegmlChars);
          curPegml = (curPegml.substr(0, pegmlX) + req.text + curPegml.substr(pegmlEndX));
          // console.log("RESULT: [" + curPegml + "]");

          // save for next pass
          board.pegml[req.y] = curPegml;
        }
      },
      getHtml: function(boardNumber) {
        var board = BOARDS[boardNumber.toString()];
        var html = '', len = board.pegml.length;
        for (var i=0; i<len; i++) {
          html += '<div class="board-row">' + pegmlToHtml(board.pegml[i]) + '</div>';
        }
        return html;
      },
      clear: function(boardNumber) {
        console.log("DevBoard.clear: " + boardNumber);
        var board = BOARDS[boardNumber.toString()];
        var message = "";
        for (var i = board.cols - 1; i >= 0; i--) {
            message += " ";
        };
        for (var row = board.rows - 1; row >= 0; row--) {
          var req = new MessageRequest(boardNumber, 0, row, message);
          this.write(req);
        };
      },
      turnOn: function() {
        for (var i = 5; i >= 0; i--) {
          this.clear(i);
        }
        allowWrites = true;
      },
      turnOff: function() {
        for (var i = 5; i >= 0; i--) {
          this.clear(i);
        }
        allowWrites = false;
      },
      isOn: function() {
        return allowWrites;
      }
    }
  }();

  return DevBoard;
}();
