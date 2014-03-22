module.exports = function MessageRequest(board, x, y, text) {

	return {
		board : parseInt(board, 10),
		x : parseInt(x, 10), 
		y : parseInt(y, 10), 
		text : text.toString()
	};
}