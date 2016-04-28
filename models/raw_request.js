module.exports = function RawRequest(board, rawString) {
	this.board = parseInt(board, 10);
	this.rawString = rawString;
}
