var _ = require("underscore")

describe("/board", function() {
  var dropit = require("../helper/api.js")({})

  afterEach(function() {
    wait()
    login("p1", function(p1) {
      dropit.clean(p1, done)
    })
  })

  describe("POST /board/:id/players", function() {
    it("should join a player to an empty board", function() {
      var board = null
      wait()
      login("p1", function(p1) {
        p1.post("/boards", function(error, response, body) {
          board = JSON.parse(body).boards[0]
          expect(board.status).toBe("waiting-for-players")
          p1.post("/board/" + board.id + "/players", function(error, response, body) {
            board = JSON.parse(body).board
            expect(board.status).toBe("waiting-for-player")
            done()
          })
        })
      })
    })

    it("should join a player to a board with a player", function() {
      wait()
      dropit.join("p1", function(p1, board) {
        expect(board.status).toBe("waiting-for-player")
        login("p2", function(p2) {
          p2.post("/board/" + board.id + "/players", function(error, response, body) {
            board = JSON.parse(body).board
            expect(board.status).toBe("ready-to-play")
            done()
          })
        })
      })
    })

    it("should not join a player to a board with two players", function() {
      wait()
      dropit.playWith("p1", "p2", function(p1, p2, board) {
        login("p3", function(p3) {
          p3.post("/board/" + board.id + "/players", function(error, response, body) {
            expect(response.statusCode).toBe(403)
            done()
          })
        })
      })
    })

    it("should remove a board from available boards when two players join", function() {
      wait()
      dropit.playWith("p1", "p2", function(p1, p2, board) {
        p1.get("/boards", function(error, response, body) {
          expect(JSON.parse(body).boards).not.toContain(board.id)
          done()
        })
      })
    })

    it("should join a bot after timeout", function() {
      wait()
      dropit.join("p1", function(p1, board) {
        expect(board.status).toBe("waiting-for-player")
        setTimeout(function() {
          p1.get("/board/" + board.id, {json:true}, function(error, response, body) {
            var players = _(body.board.players).pluck("name")
            expect(response.statusCode).toBe(200)
            expect(body.board.status).toBe("waiting-for-drop")
            expect(players).toContain("p1")
            expect(players).toContain("bot")
            done()
          })
        }, 50)
      }, {waitForJoin: 25})
    })
  })

  describe("POST /board/:id/drops", function() {
    it("should drop a symbol for a player", function() {
      wait()
      dropit.playWith("p1", "p2", function(p1, p2, board) {
        p1.post("/board/" + board.id + "/drops", {json: {symbol: "spock"}}, function(error, response, body) {
          expect(response.statusCode).toBe(201)
          expect(body.board.status).toBe("waiting-for-drop")
          expect(body.board.drops["p1"]).toBe("spock")
          done()
        })
      })
    })

    it("should end the game after the drop of the second player", function() {
      wait()
      dropit.playWith("p1", "p2", function(p1, p2, board) {
        p1.post("/board/" + board.id + "/drops", {json: {symbol: "spock"}}, function(error, response, body) {
          p2.post("/board/" + board.id + "/drops", {json: {symbol: "rock"}}, function(error, response, body) {
            expect(response.statusCode).toBe(201)
            expect(body.board.status).toBe("game-over")
            done()
          })
        })
      })
    })

    it("should drop a timeout symbol after timeout", function() {
      wait()
      dropit.playWith("p1", "p2", function(p1, p2, board) {
        p1.post("/board/" + board.id + "/drops", {json: {symbol: "spock"}}, function(error, response, body) {
          setTimeout(function() {
            p1.get("/board/" + board.id, {json: true}, function(error, response, body) {
              expect(response.statusCode).toBe(200)
              expect(body.board.status).toBe("game-over")
              expect(body.board.drops["p2"]).toBe("timeout")
              done()
            })
          }, 50)
        })
      }, {waitForDrop: 25})
    })

    it("should drop a timeout symbol after timeout for both players", function() {
      wait()
      dropit.playWith("p1", "p2", function(p1, p2, board) {
        setTimeout(function() {
          p1.get("/board/" + board.id, {json: true}, function(error, response, body) {
            expect(response.statusCode).toBe(200)
            expect(body.board.status).toBe("game-over")
            expect(body.board.drops["p1"]).toBe("timeout")
            expect(body.board.drops["p2"]).toBe("timeout")
            done()
          })
        }, 100)
      }, {waitForDrop: 25})
    })
  })
})
