var net = require('net');
var bufferpack = require('bufferpack');
var sleep = require('sleep');
var MessageRequest = require('../models/message_request.js');
var RawRequest = require('../models/raw_request.js');

module.exports = function () {
  var Board;

  Board = function () {
    var BOARD_IP = "10.105.4.250",
      BOARD_PORT = 25,
      BOARD_PORT_TOP = 26,
      BOARD_PORT_BOTTOM = 27,
      BOARD_IP_MINI = "10.105.4.252",
      BOARD_PORT_MINI = 26,
      MINI_SOCKET = new net.Socket('tcp4'),
      TOP_BOARD_SOCKET = new net.Socket('tcp4');
      BOTTOM_BOARD_SOCKET = new net.Socket('tcp4'),
      BOARDS = {
        '0': { 'cols': 80, 'rows': 12, 'right': 1, 'below': 2, 'port': BOARD_PORT_TOP, 'ip': BOARD_IP },
        '1': { 'cols': 80, 'rows': 12, 'right': 4, 'below': 3, 'port': BOARD_PORT_TOP, 'ip': BOARD_IP },
        '4': { 'cols': 32, 'rows': 12, 'right': -1, 'below': 5, 'port': BOARD_PORT_TOP, 'ip': BOARD_IP },

        '2': { 'cols': 80, 'rows': 12, 'right': 3, 'below': -1, 'port': BOARD_PORT_BOTTOM, 'ip': BOARD_IP },
        '3': { 'cols': 80, 'rows': 12, 'right': 5, 'below': -1, 'port': BOARD_PORT_BOTTOM, 'ip': BOARD_IP },
        '5': { 'cols': 32, 'rows': 12, 'right': -1, 'below': -1, 'port': BOARD_PORT_BOTTOM, 'ip': BOARD_IP },

        '6': { 'cols': 80, 'rows': 10, 'right': -1, 'below': -1, 'port': BOARD_PORT_MINI, 'ip': BOARD_IP_MINI },
      };

    var GREEN = String.fromCharCode(29),
        RED = String.fromCharCode(30),
        ORANGE = String.fromCharCode(31),
        BSTOP = String.fromCharCode(28),
        BLINK = String.fromCharCode(7),
        FILL = String.fromCharCode(127);

    var allowWrites = true,
        isBlanked = false;


    TOP_BOARD_SOCKET.on('connect', function(){
      console.log("Top Board Connected");
      setTimeout(writeTopBoard, 50);
    });

    TOP_BOARD_SOCKET.on('error', function(err) {
      console.log('Error Connecting To Top Socket: ' + err);
    });

    BOTTOM_BOARD_SOCKET.on('connect', function() {
      console.log('Bottom Board Connected');
      setTimeout(writeBottomBoard, 50);
    })

    BOTTOM_BOARD_SOCKET.on('error', function(err) {
      console.log('Error Connecting To Bottom Socket: ' + err);
    });

    /**
     * Replaces the color placeholders with the required control characters. Those characters are used by the
     * board to color the subsequent characters
     * @param message
     * @returns {String} The properly formated string
     */
    function replaceColorPlaceholders(message) {
      // replace blinking codes
      message = message.replace(/\{b\}/g, BLINK); // Start Blinking (ON/OFF)
      message = message.replace(/\{bs\}/g, BSTOP); // Stop Blinking
      // replace 2-color blinking codes
      message = message.replace(/\{bor\}/g, ORANGE + BLINK + BLINK + RED); // Orange + Red
      message = message.replace(/\{bgr\}/g, GREEN + BLINK + BLINK + RED); // Green + Red
      message = message.replace(/\{bro\}/g, BLINK + BLINK + ORANGE + RED); // Red + Orange
      message = message.replace(/\{bgo\}/g, BLINK + BLINK + ORANGE + GREEN); // Green + Orange
      message = message.replace(/\{brg\}/g, RED + BLINK + BLINK + GREEN); // Red + Green
      message = message.replace(/\{bog\}/g, ORANGE + BLINK + BLINK + GREEN); // Orange + Green
      // replace color codes
      message = message.replace(/\{g\}/g, GREEN); // Green
      message = message.replace(/\{r\}/g, RED); // Red
      message = message.replace(/\{o\}/g, ORANGE); // Orange
      // replace the fill code
      message = message.replace(/\{f\}/g, FILL); // Fill: all pixels in a rectangle
      return message;
    }

    /**
     * Replaces arbitrary char codes with the actual ASCII character. Use {#nn} where nn is the decimal (not hex) index of the ASCII character.
     */
    function replaceCharCodes(message) {
      // replace char codes
      var r = true;
      while (r) {
        r = /\{\#[0-9]+\}/g.exec(message);
        if (r) {
          var n = parseInt(r[0].substring(2,r[0].length-1));
          message = message.substr(0,r.index)+String.fromCharCode(n)+message.substr(r.index+r[0].length)
        }
      }
      return message;
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

    /**
     * Generates a buffer to send to the socket from a given message object.
     * @param {MessageRequest} message the object that should be written to the board
     * @returns {Buffer} a data buffer for writing to the socket
     */
    function generateBuffer(message) {
      if (message instanceof MessageRequest)
        return generateMessageBuffer(message);
      if (message instanceof RawRequest)
        return generateRawBuffer(message);
      return null;
    }

    function generateMessageBuffer(message) {
        var row = message.y;
        var col = message.x;
        var text = escapeCharacters(replaceColorPlaceholders(message.text));
        var buffer = new Buffer(5+text.length);
        buffer.writeUInt8(0x01,0);
        buffer.writeUInt8(message.board+32,1);  // display + 32
        buffer.writeUInt8(row+0x20,2); // row
        buffer.writeUInt8(col+0x20,3); // col
        buffer.write(text,4, buffer.length-4, 'ascii');
        buffer.writeUInt8(0x04,4+text.length);
        return buffer;
    }

    function generateRawBuffer(message) {
      var data = replaceColorPlaceholders(replaceCharCodes(message.rawString));
      // console.log("Sending raw message (" + data.length + " bytes) based on: " + message.rawString + "");
      var buffer = new Buffer(data.length);
      buffer.write(data, 0, buffer.length, 'ascii');
      return buffer;
    }



    var topBoardQueue = [],
        bottomBoardQueue = [];

    function writeTopBoard() {
      var message = topBoardQueue.shift(),
          buffer, success;
      if (message) {
        buffer = generateBuffer(message);
        success = TOP_BOARD_SOCKET.write(buffer);
        if (!success) {
          console.log('Failed to write message: ' + message);
        }
      }
      setTimeout(writeTopBoard, 50);
    }

    function writeBottomBoard() {
      var message = bottomBoardQueue.shift(),
          buffer, success;
      if (message) {
        buffer = generateBuffer(message);
        success = BOTTOM_BOARD_SOCKET.write(buffer);
        if (!success) {
          console.log('Failed to write message: ' + message);
        }
      }
      setTimeout(writeBottomBoard, 50);
    }

    function isTopBoardRequest(req) {
      return ([0,1,4].indexOf(req.board) != -1);
    }

    return {
      connect: function() {
        TOP_BOARD_SOCKET.connect(BOARD_PORT_TOP, BOARD_IP);
        BOTTOM_BOARD_SOCKET.connect(BOARD_PORT_BOTTOM, BOARD_IP);
      },
      /**
       * @param {MessageRequest} req
       */
      write: function (req) {
        if (allowWrites) {
          if (isTopBoardRequest(req)) {
            topBoardQueue.push(req);
          }
          else {
            bottomBoardQueue.push(req);
          }
        }
      },
      clear: function(boardNumber) {
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
        topBoardQueue = [];
        bottomBoardQueue = [];
        for (var i = 5; i >= 0; i--) {
          var req = new RawRequest(i, "{#1}{#" + (32+i) + "}{#127}{#40}{#4}");
          this.write(req);
        }
        allowWrites = true;
        isBlanked = false;
      },
      turnOff: function() {
        topBoardQueue = [];
        bottomBoardQueue = [];
        for (var i = 5; i >= 0; i--) {
          var req = new RawRequest(i, "{#1}{#" + (32+i) + "}{#127}{#47}{#4}");
          this.write(req);
        }
        // allowWrites = false;
        isBlanked = true;
      },
      isOn: function() {
        // return allowWrites;
        return !isBlanked;
      }
    }
  }();

  return Board;
}();
