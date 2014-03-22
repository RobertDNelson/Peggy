var net = require('net');
var bufferpack = require('bufferpack');
var sleep = require('sleep');

module.exports = function () {
  var Board;

  //https://github.com/ryanrolds/bufferpack

  /*
   * BOARDS
   *
   *  0 1 4
   *  2 3 5
   */

  // server is at .251
  Board = function () {
    var BOARD_IP = "10.105.4.250",
      BOARD_PORT = 25,
      BOARD_PORT_TOP = 26,
      BOARD_PORT_BOTTOM = 27,
      BOARD_IP_MINI = "10.105.4.252",
      BOARD_PORT_MINI = 26,
      MINI_SOCKET = new net.Socket('tcp4'),
      TOP_BOARD_SOCKET = new net.Socket('tcp4');
      BOTTOM_BOARD_SOCKET = new net.Socket('tcp4');

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
      message = message.replace('{#0}', String.fromCharCode(30), 'g');
      message = message.replace('{#1}', String.fromCharCode(31), 'g');
      message = message.replace('{#2}', String.fromCharCode(32), 'g');
      return message;
    }

    /**
     * Generates a buffer to send to the socket from a given message object.
     * @param {MessageRequest} message the object that should be written to the board
     * @returns {Buffer} a data buffer for writing to the socket
     */
    function generateBuffer(message) {
      console.log(message);

        var row = message.y;
        var col = message.x;
        var text = message.text;
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

    return {
      connect: function() {
        TOP_BOARD_SOCKET.connect(BOARD_PORT_TOP, BOARD_IP);
        BOTTOM_BOARD_SOCKET.connect(BOARD_PORT_BOTTOM, BOARD_IP);
      },
      /**
       * @param {MessageRequest} req
       */
      write: function (req) {
        if (isTopBoardRequest(req)) {
          topBoardQueue.push(req);
        }
        else {
          bottomBoardQueue.push(req);
        }
      }
    }
  }();

  return Board;
}();

