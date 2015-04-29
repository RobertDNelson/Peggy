var MessageRequest = require('../models/message_request.js');

module.exports = function () {
  var DevBoard;

  DevBoard = function () {
    var BOARDS = {
        '0': { 'cols': 80, 'rows': 12, 'right': 1, 'below': 2, 'chars': [] },
        '1': { 'cols': 80, 'rows': 12, 'right': 4, 'below': 3, 'chars': [] },
        '4': { 'cols': 32, 'rows': 12, 'right': -1, 'below': 5, 'chars': [] },

        '2': { 'cols': 80, 'rows': 12, 'right': 3, 'below': -1, 'chars': [] },
        '3': { 'cols': 80, 'rows': 12, 'right': 5, 'below': -1, 'chars': [] },
        '5': { 'cols': 32, 'rows': 12, 'right': -1, 'below': -1, 'chars': [] },

        '6': { 'cols': 80, 'rows': 10, 'right': -1, 'below': -1, 'chars': [] },
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

    function charsToHtml(charArray) {
      if (charArray.length == 0) return "";
      var c = charArray[0][1],
          out = '<span class="color-'+c+'">';
      for (var i=0; i<charArray.length; i++) {
        if (charArray[i][1] != c) {
          c = charArray[i][1];
          out += '</span><span class="color-'+c+'">';
        }
        out += charArray[i][0];
      }
      out += '</span>';
      return out;
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

          // update charArray
          var chars = board.chars[req.y] || [], c=null, offset=0;
          for (var p=0, m=req.text.length; p<m; ) {
            var t = req.text[p];
            if (t == "{") {
              c = req.text[p+1];
              p+=3;
            } else {
              if (c == null) c = "g";
              chars[req.x+offset] = [ req.text[p], c ]; // each character is represented by an array: [char:String, color:String];
              offset++;
              p++;
            }
          }
          board.chars[req.y] = chars; // just in case we made a new array above
          // console.log("Wrote to row " + req.y + ":");
          // console.log(chars);
        }
      },
      getHtml: function(boardNumber) {
        var board = BOARDS[boardNumber.toString()];
        var html = '', len = board.chars.length;
        for (var i=0; i<len; i++) {
          html += '<div class="board-row">' + charsToHtml(board.chars[i]) + '</div>';
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
