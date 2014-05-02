var net = require('net');
var bufferpack = require('bufferpack');
var sleep = require('sleep');
var MessageRequest = require('../models/message_request.js');

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

    var allowWrites = true;


    TOP_BOARD_SOCKET.on('connect', function(){
      console.log("Top Board Connected");
      setTimeout(writeTopBoard, 50);
    });

    TOP_BOARD_SOCKET.on('error', function(err) {
      console.log('Error Connecting To Top Socket: ' + err);
    });

    BOTTOM_BOARD_SOCKET.on('connect', function() {
      console.log('Bottom Board Conencted');
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
      message = message.replace(/\{g\}/g, String.fromCharCode(29)); // Green
      message = message.replace(/\{r\}/g, String.fromCharCode(30)); // Red
      message = message.replace(/\{o\}/g, String.fromCharCode(31)); // Orange
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
        var row = message.y;
        var col = message.x;
        var text = escapeCharacters(replaceColorPlaceholders(message.text));
        var buffer = new Buffer(5+text.length);
        buffer.writeUInt8(0x01,0);
        buffer.writeUInt8(message.board+32,1);  // display + 32
        buffer.writeUInt8(row+0x20,2); // row
        buffer.writeUInt8(col+0x20,3); // col
        buffer.write(text,4);
        buffer.writeUInt8(0x04,4+text.length);
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

  /*
   * BOARDS
   *
   *  0 1 4
   *  2 3 5
   */
   /*display_widths = {
    '0': { 'cols': 80, 'rows': 12, 'right': 1, 'below': 2, 'port': BOARD_PORT_TOP, 'ip': BOARD_IP },
    '1': { 'cols': 80, 'rows': 12, 'right': 4, 'below': 3, 'port': BOARD_PORT_TOP, 'ip': BOARD_IP },
    '4': { 'cols': 32, 'rows': 12, 'right': -1, 'below': 5, 'port': BOARD_PORT_TOP, 'ip': BOARD_IP },

    '2': { 'cols': 80, 'rows': 12, 'right': 3, 'below': -1, 'port': BOARD_PORT_BOTTOM, 'ip': BOARD_IP },
    '3': { 'cols': 80, 'rows': 12, 'right': 5, 'below': -1, 'port': BOARD_PORT_BOTTOM, 'ip': BOARD_IP },
    '5': { 'cols': 32, 'rows': 12, 'right': -1, 'below': -1, 'port': BOARD_PORT_BOTTOM, 'ip': BOARD_IP },

    '6': { 'cols': 80, 'rows': 10, 'right': -1, 'below': -1, 'port': BOARD_PORT_MINI, 'ip': BOARD_IP_MINI },

}
*/

    return {
      connect: function() {
        TOP_BOARD_SOCKET.connect(BOARD_PORT_TOP, BOARD_IP);
        BOTTOM_BOARD_SOCKET.connect(BOARD_PORT_BOTTOM, BOARD_IP);
      },
      /**
       * @param {MessageRequest} req
       */
      write: function (req) {
        if (allowWrites) { // 7:52
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
          this.clear(i);
        }
        allowWrites = true;
      },
      turnOff: function() {
        topBoardQueue = [];
        bottomBoardQueue = [];
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

  return Board;
}();
