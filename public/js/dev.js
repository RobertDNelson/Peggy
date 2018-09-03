(function($){

	function loadBoard(boardNumber) {
		$.ajax({
			type: "GET",
			url: "/peggy/boardhtml?board="+boardNumber,
			dataType: "html",
			success: function(data) {
				$("#main .board-"+boardNumber).html(data);
			}
		});
	}

	function loadAllBoards() {
		for (var i=0; i<6; i++) {
			loadBoard(i);
		}
	}

	function printBoard() {
		var text = $("#art").val();
		var board = parseInt($("#sendto").val());
		window.writeBoard(board, text);
	}

	function clearBoard() {
		var board = parseInt($("#sendto").val());
		window.clearBoard(board);
	}

	window.write = function(board, x, y, text) {
		$.ajax({
			type: "GET",
			url: "/peggy/write?board=" + encodeURIComponent(board) + "&x=" + encodeURIComponent(x) + "&y=" + encodeURIComponent(y) + "&text=" + encodeURIComponent(text),
			dataType: "html",
			success: function(data, textStatus, jqXHR) {
				console.log("Write completed successfully.");
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log("Write failed (" + errorThrown + "). Details: ", jqXHR);
			}
		})
	};

	window.writeBoard = function(board, text) {
		var lines = text.split("\n");
		console.log(lines);
		for (var i=0; i<lines.length; i++) {
			if (i > 11) break;
			var line = lines[i] + "                                                                                ";
			window.write(board, 0, i, line);
		}
	};

	window.clearBoard = function(board) {
		for (var i=0; i<12; i++) {
			var line = "                                                                                ";
			window.write(board, 0, i, line);
		}
	};

	$(document).ready(function() {
		$("#send").click(printBoard);
		$("#clear").click(clearBoard);
		loadAllBoards();
		setInterval(loadAllBoards, 500);
	});
})(jQuery);
