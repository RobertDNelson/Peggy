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
    var BOARD_IP = 10.1.3.250,
      BOARD_PORT = 25,
      BOARD_PORT_TOP = 26,
      BOARD_PORT_BOTTOM = 27,
      BOARD_IP_MINI = 10.1.3.252,
      BOARD_PORT_MINI = 26,
      MINI_SOCKET = new net.Socket('tcp4'),
      TOP_BOARD_SOCKET = new net.Socket('tcp4');
      BOTTOM_BOARD_SOCKET = new net.Socket('tcp4');

    TOP_BOARD_SOCKET.on('connect', function(){
      console.log("Top Board Connected");
      //1, 35, 32, 32, 88, 4
       var raw = '013532328804';
          buffer = new Buffer(raw, 'hex');
      console.log(buffer);
        TOP_BOARD_SOCKET.write(buffer, 'ascii');
//      for(var row = 0; row < 12; row++) {
//        for (var col = 0; col < 32; col++ ) {
//          console.log("Printing" + row + " " + col);
//          var buffer = new Buffer(6);
//          buffer.writeUInt8(0x01,0);
//          buffer.writeUInt8(4+0x32,1);  // display + 32
//          buffer.writeUInt8(row+0x20,2); // row
//          buffer.writeUInt8(col+0x20,3); // col
//          buffer.writeUInt8(0x88,4);
//          buffer.writeUInt8(0x04,5);
//          console.log(buffer);
//          TOP_BOARD_SOCKET.write(buffer);
//          sleep.sleep(1);
//        }
//      }
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

    MINI_SOCKET.connect(BOARD_PORT_MINI, BOARD_IP_MINI);
    TOP_BOARD_SOCKET.connect(BOARD_PORT_TOP, BOARD_IP);
    BOTTOM_BOARD_SOCKET.connect(BOARD_PORT_BOTTOM, BOARD_IP);

    return {
      miniSocket: MINI_SOCKET,
      topBoardSocket: TOP_BOARD_SOCKET,
      bottomBoardSocket: BOTTOM_BOARD_SOCKET,
      generateBuffer: function(board, row, col, message) {
        message = replaceColorPlaceholders(message);

        var stringByteLength = Buffer.byteLength(message, 'ascii'),
          bufferLength = stringByteLength + 4,
          buffer = new Buffer(bufferLength),
          packFormat = 'BBBB' + (stringByteLength - 1) + 'sB',
          boardCode = board + 0x32,
          rowCode = row + 0x20,
          colCode = col + 0x20,
          termCode = 0x04,
          values = [0x01, boardCode, rowCode, colCode, message, termCode];

        bufferpack.packTo(packFormat, buffer, 0, values);

        return buffer;
      },
      connect: function() {},
      writeLine: function (line) {
      }
    }
  }();

  return Board;
}();

