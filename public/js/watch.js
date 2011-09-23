$(function() {
  _(io.connect()).tap(function(socket) {
    socket.emit("subscribe", "/boards", function(channels) {

      socket.on("join", function(player, board) {
        // console.log("join", player, board)
        var $board = $("#board-" + board.id)
        if ($board.length === 0) {
          $("#template").children().clone()
            .attr("id", "board-" + board.id)
            .find(".first.player")
              .attr("name", player.name)
              .find(".player_avatar").attr("src", player.name === "bot" ? "/images/bot.png" : "/images/nerd.png").end()
              .find(".player_name").text(player.name).end()
              .end()
            .find(".vs").hide().end()
            .find(".second.player").hide().end()
            .prependTo("#boards")
        } else {
          $board
            .find(".vs").show().end()
            .find(".second.player")
              .show()
              .attr("name", player.name)
              .find(".player_avatar").attr("src", player.name === "bot" ? "/images/bot.png" : "/images/nerd.png").end()
              .find(".player_name").text(player.name).end()
        }
      })

      socket.on("drop", function(player, symbol, board) {
        // console.log("drop", player, symbol, board)
        $("#board-" + board.id)
          .find(".player[name=" + player.name + "] .player_symbol")
            .attr("src", "/images/" + symbol + ".png")
            .end()
      })

      socket.on("over", function(board) {
        // console.log("over", board)
        var $board = $("#board-" + board.id)
        _(board.score).each(function(score, name) {
            var color = score.result === "win" ? "green" : "red",
                avatar = name === "bot" ? "bot" : "nerd",
                symbol = board.drops[name]
            $board.find(".player[name=" + name + "]")
              .addClass(score.result)
              .find(".player_avatar").attr("src", "/images/" + avatar + "_" + color + ".png").end()
              .find(".player_symbol").attr("src", "/images/" + symbol + "_" + color + ".png").end()
        })
        socket.emit("unsubscribe", "/board/" + board.id)
      })

      socket.on("create", function(board) {
        socket.emit("subscribe", "/board/" + board.id)
      })
    })
  })  
})
