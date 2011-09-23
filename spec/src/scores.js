var Player = require("./../../src/player"),
    Board = require("./../../src/board"),
    Scores = require("./../../src/scores"),
    _ = require("underscore")


describe("Scores", function() {
  beforeEach(function() {
    wait()
    var self = this
    self.redis = require("redis").createClient(REDIS.port, REDIS.host)
    self.redis.flushdb(function() {
      self.p1 = new Player("p1")
      self.p2 = new Player("p2")
      self.bot = new Player("bot")
      self.board = new Board()
      self.board.join(self.p1)
      self.board.join(self.p2)
      self.board.drop(self.p1, "spock")
      self.board.drop(self.p2, "scissors")
      done()
    })
  })

  it("should keep the players score", function() {
    wait()
    var self = this
    _(new Scores(self.redis)).tap(function(scores) {
      scores.score(self.board, function() {
        scores.forPlayer(self.p1, function(error, p1Scores) {
          expect(p1Scores.games).toEqual(1)
          expect(p1Scores.score).toEqual(5)
          scores.forPlayer(self.p2, function(error, p2Scores) {
            expect(p2Scores.games).toEqual(1)
            expect(p2Scores.score).toEqual(1)
            done()
          })
        })
      })
    })
  })

  it("should count the number of games played and number of unique players", function() {
    wait()
    var self = this
    _(new Scores(self.redis)).tap(function(scores) {
      scores.score(self.board, function() {
        scores.total(function(error, total) {
          expect(total.games).toEqual(1)
          expect(total.players).toEqual(2)
          done()
        })
      })
    })
  })

  it("should store the leaderboard", function() {
    wait()
    var self = this
    _(new Scores(self.redis)).tap(function(scores) {
      scores.score(self.board, function() {
        scores.leaderboard(function(error, leaderboard) {
          expect(leaderboard.length).toBe(2)
          expect(leaderboard[0].player).toBe("p1")
          expect(leaderboard[0].score).toBe(5)
          expect(leaderboard[1].player).toBe("p2")
          expect(leaderboard[1].score).toBe(1)
          done()
        })
      })
    })
  })

  describe("bot", function() {
    it("should not be in the leaderboard", function() {
      wait()
      var self = this, board = new Board()
      board.join(self.p1)
      board.join(self.bot)
      board.drop(self.p1, "spock")
      board.drop(self.bot, "scissors")
      _(new Scores(self.redis)).tap(function(scores) {
        scores.score(board, function() {
          scores.leaderboard(function(error, leaderboard) {
            expect(leaderboard.length).toBe(1)
            expect(leaderboard[0].player).toBe("p1")
            expect(leaderboard[0].score).toBe(5)
            done()
          })
        })
      })
    })
  })
})
