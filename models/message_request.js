module.exports = function MessageRequest(board, x, y, text) {
	this.board = parseInt(board, 10);
	this.x = parseInt(x, 10);
	this.y = parseInt(y, 10);
	this.text = text.toString();
}
