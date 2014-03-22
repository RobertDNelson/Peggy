module.exports = function MessageRequest(board, x, y, text) {
	return {
		board : board,
		x : x, 
		y : y, 
		text : text
	};
}