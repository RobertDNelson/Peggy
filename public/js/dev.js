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

	$(document).ready(function() {
		loadAllBoards();
		setInterval(loadAllBoards, 1000);
	});
})(jQuery);
