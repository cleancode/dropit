var io = require("socket.io-client")

describe("Socket", function() {
  var dropit = require("../helper/api.js")({})

  afterEach(function() {
    wait()
    login("p1", function(p1) {
      dropit.clean(p1, done)
    })
  })

  xit("should emit join when opponent join the board", function() {
    wait()
    dropit.connect(function(socket) {
      dropit.join("p1", function(p1, board) {
        socket.emit("subscribe", "/board/" + board.id, function(channels) {
          socket.on("join", function(player) {
            expect(player.name).toBe("p2")
            done()
          })
          dropit.joinTo("p2", board, function(p2, board) {
            expect(board.status).toBe("ready-to-play")
          })
        })
      })
    })
  })

  xit("should emit drop when player drop a symbol on the board", function() {
    wait()
    dropit.connect(function(socket) {
      dropit.join("p1", function(p1, board) {
        socket.emit("subscribe", "/board/" + board.id, function(channels) {
          socket.on("drop", function(player, symbol) {
            expect(player.name).toBe("p1")
            expect(symbol).toBe("spock")
            done()
          })
          dropit.joinTo("p2", board, function(p2, board) {
            dropit.dropOn(p1, board, "spock", function(board) {
              expect(board.status).toBe("waiting-for-drop")
            })
          })
        })
      })
    })
  })

  xit("should emit drop when last player drop a symbol on the board", function() {
    wait()
    dropit.connect(function(socket) {
      dropit.join("p1", function(p1, board) {
        dropit.joinTo("p2", board, function(p2, board) {
          dropit.dropOn(p1, board, "spock", function(board) {
            socket.emit("subscribe", "/board/" + board.id, function(channels) {
              socket.on("drop", function(player, symbol) {
                expect(player.name).toBe("p2")
                expect(symbol).toBe("lizard")
                done()
              })
              dropit.dropOn(p2, board, "lizard", function(board) {
                expect(board.status).toBe("game-over")
              })
            })
          })
        })
      })
    })
  })

  xit("should emit over when game is over", function() {
    wait()
    dropit.connect(function(socket) {
      dropit.join("p1", function(p1, board) {
        dropit.joinTo("p2", board, function(p2, board) {
          dropit.dropOn(p1, board, "spock", function(board) {
            socket.emit("subscribe", "/board/" + board.id, function(channels) {
              socket.on("over", function(board) {
                expect(board.score.p2.result).toBe("win")
                done()
              })
              dropit.dropOn(p2, board, "lizard", function(board) {
                expect(board.status).toBe("game-over")
              })
            })
          })
        })
      })
    })
  })
})
