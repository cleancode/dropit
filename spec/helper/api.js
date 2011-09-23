var io = require("socket.io-client")


module.exports = function(dropit) {

  dropit.connect = function(callback) {
    _(io.connect(DROPIT.url, {"reconnect": false, "force new connection": true})).tap(function(socket) {
      socket.on("connect", function() {
        callback(socket)
      })
    })
  }

  dropit.join = function(name, callback) {
    login(name, function(player) {
      player.post("/boards", function(error, response, body) {
        dropit.joinTo(name, JSON.parse(body).boards[0], callback)
      })
    })
  }

  dropit.joinTo = function(name, board, callback) {
    login(name, function(player) {
      player.post("/board/" + board.id + "/players?waitForJoin=10&waitForDrop=10", function(error, response, body) {
        expect(response.statusCode).toBe(201)
        callback(player, JSON.parse(body).board)
      })
    })
  }

  dropit.dropOn = function(player, symbol, board, callback) {
    player.post("/board/" + board.id + "/drops", {json: {symbol: symbol}}, function(error, response, body) {
      callback(body.board)
    })
  }

  dropit.leaveFrom = function(player, board, callback) {
    player.del("/board/" + board.id + "/player/" + player.name, function(error, response, body) {
      callback()
    })
  }

  dropit.playWith = function(p1, p2, callback) {
    dropit.join(p1, function(p1, board) {
      dropit.joinTo(p2, board, function(p2, board) {
        callback(p1, p2, board)
      })
    })
  }

  dropit.clean = function(p1, callback) {
    p1.del("/boards", function(error, response, body) {
      callback()
    })
  }

  return dropit
}
