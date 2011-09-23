$(function() {

  _.mixin({
    pick: function(obj) {
      if (!_.isArray(obj)) return obj
      return obj[Math.floor(Math.random() * obj.length)]
    }
  })

  _(io.connect()).tap(function(socket) {
    var request = superagent, me = null, opponent = null, board = null, result = null, thinking = null

    $("#login")
      .show()
      .find("#login-player").focus().end()
      .find("#login-button")
        .bind("click", function(event) {
          event.preventDefault()
          $(this).parents("#login-form").trigger("submit")
        })
        .end()
      .find("#login-form")
        .bind("submit", function(event) {
          event.preventDefault()
          var name = $("#login-player").val()
          if (!_(name).isEmpty()) {
            $("#login").hide()
            $("#login-player").val("")
            matching(me = {name: name})
          }
        })

    socket.on("join", function(player, board) {
      // console.log("join", player, board)
      if (board.status === "ready-to-play") {
        if (_(board.players).chain().pluck("name").contains(me.name).value()) {
          opponent = _(board.players).detect(function(opponent) { return opponent.name !== me.name })
          return scores(opponent, function() {
            play()
          })
        }
        unsubscribe(function() {
          setTimeout(function() { matching() }, 250)
        })
      }
    })

    socket.on("drop", function(player, symbol, board) {
      // console.log("drop", player, symbol, board)
      if (player.name === me.name) {
        $(".board.me", "#board")
          .undelegate()
          .empty()
          .append(
            $("#board-dropped-template").children().clone().attr("src", "/images/big/" + symbol + ".png")
          )
      } else {
        stopToThink()
        $(".board.opponent", "#board")
          .empty()
          .append(
            $("#board-dropped-template").children().clone().attr("src", "/images/big/hidden.png")
          )
      }
    })

    socket.on("over", function(board) {
      // console.log("over", board)
      result = board.score[me.name].result
      $(".board.me", "#board")
        .find(".symbol").attr("src", "/images/big/" + board.drops[me.name] + "_" + (board.score[me.name].result === "win" ? "green" : "red") + ".png")
      $(".board.opponent", "#board")
        .find(".symbol").attr("src", "/images/big/" + board.drops[opponent.name] + "_" + (board.score[opponent.name].result === "win" ? "green" : "red") + ".png")
      leave()
    })

    socket.on("empty", function(board) {
      // console.log("empty", board)
      again()
    })

    function play() {
      $("#board")
        .find(".player.me").each(function() { showPlayer($(this), me) }).end()
        .find(".player.opponent").each(function() { showPlayer($(this), opponent) }).end()
        .find(".board.me").empty().append($("#board-play-template").children().clone()).end()
        .find(".board.opponent").empty().append($("#board-play-template").children().clone()).end()
        .show()

      positionVs()
      block("PLAY!")
      setTimeout(function() {
        $(".board.me", "#board")
          .delegate(".symbol", "click", function() {
            drop(symbolOf($(this)))
          })
          .delegate(".symbol", "mouseenter mouseleave", function() {
            toggleSymbolSelection($(this))
          })
        startToThink()
        unblock()
      }, 1500)
    }

    function matching() {
      block("MATCHING...")
      scores(me, function(player) {
        boards(function() {
          subscribe()
          join()
        })
      })
    }

    $("#play-game").bind("click", function(event) {
      event.preventDefault()
      opponent = board = result = thinking = null
      $("#board").hide()
      matching()
    })

    $("#leave-game").bind("click", function(event) {
      event.preventDefault()
      opponent = board = result = thinking = null
      $("#board").hide()
      $("#login").show()
      unblock()
    })

    function again() {
      scores(me, function() {
        showPlayer($(".player.me", "#board"), me)
        scores(opponent, function() {
          showPlayer($(".player.opponent", "#board"), opponent)
          setTimeout(function() {
            $("#game-over").find(".result").text(result.toUpperCase()).end()
            block($("#game-over"))
          }, 1500)
        })
      })
    }

    function thinkAndSelect() {
      var thinkedAt = _(["rock","scissors","paper","lizard","spock"]).pick()
      $(".board.opponent", "#board")
        .find(".selected").each(function() { toggleSymbolSelection($(this)) }).end()
        .find("." + thinkedAt).each(function() { toggleSymbolSelection($(this)) }).end()
    }

    function startToThink() {
      thinking = setInterval(thinkAndSelect, 250)
    }

    function stopToThink() {
      thinking = clearInterval(thinking)
    }

    function symbolOf($symbol) {
      return _($symbol.attr("class").split(/\s+/)).without("symbol", "selected").join("")
    }

    function showPlayer($player, player) {
      if (player.name === "bot") {
        $player.find("img").attr("src", "/images/bot.png")
      }
      $player
        .find(".player_name").text(player.name.toUpperCase()).end()
        .find(".player_scores").text([player.scores.games||0, player.scores.score||0].join("/")).end()
    }

    function toggleSymbolSelection($symbol) {
      if ($symbol.hasClass("selected")) {
        $symbol
          .removeClass("selected")
          .attr("src", $symbol.attr("src").replace("_green.png", ".png"))
      } else {
        $symbol
          .addClass("selected")
          .attr("src", $symbol.attr("src").replace(".png", "_green.png"))
      }
    }

    function join() {
      request
        .post("/board/" + board.id + "/players?waitForJoin=1500&timeToThink=10000")
        .set("X-Dropit-User", me.name)
        .set("Accept", "application/json")
        .end()
    }

    function scores(player, callback) {
      request
        .get("/player/" + player.name + "/scores")
        .set("Accept", "application/json")
        .end(function(response) {
          callback(_(player).extend(response.body))
        })
    }

    function boards(callback) {
      request
        .post("/boards")
        .set("X-Dropit-User", me.name)
        .set("Accept", "application/json")
        .end(function(response) {
          callback(board = _(response.body.boards).pick())
        })
    }

    function drop(symbol) {
      request
        .post("/board/" + board.id + "/drops")
        .set("X-Dropit-User", me.name)
        .set("Accept", "application/json")
        .data({symbol: symbol})
        .end()
    }

    function leave() {
      request
        .del("/board/" + board.id + "/player/" + me.name)
        .set("X-Dropit-User", me.name)
        .end()
    }

    function subscribe() {
      socket.emit("subscribe", "/board/" + board.id)
    }

    function unsubscribe(callback) {
      socket.emit("unsubscribe", "/board/" + board.id, callback)
    }

    function block(message) {
      $.blockUI({
        message: message,
        css: { 
          "border": "none", 
          "padding": "15px", 
          "font-size": "24px",
          "background-color": "#000", 
          "-webkit-border-radius": "10px", 
          "-moz-border-radius": "10px", 
          "opacity": 0.7, 
          "color": "#fff" 
        }
      })
    }

    function unblock() {
      $.unblockUI()
    }

    function positionVs() {
      $("#vs").css("left", $(window).width()/2 - $("#vs").width()/2 - 10)
    }

    $(window).resize(positionVs)
  })
})
