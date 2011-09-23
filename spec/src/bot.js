var Player = require("./../../src/player"),
    Board = require("./../../src/board"),
    Bot = require("./../../src/bot")

describe("Bot", function() {
  beforeEach(function() {
    this.p1 = new Player("p1")
    this.board = new Board()
    this.bot = new Bot()
  })

  xit("should drop when board can be played and he is first player", function() {
    // TODO: make it pass
    wait()
    this.bot.join(this.board)
    this.board.join(this.p1)
    this.board.drop(this.p1, "spock")
    var board = this.board
    setTimeout(function() {
      expect(board.status).toBe("game-over")
      done()
    }, 5)
  })

  xit("should drop when board can be played and he is second player", function() {
    // TODO: make it pass
    wait()
    this.board.join(this.p1)
    this.bot.join(this.board)
    this.board.drop(this.p1, "spock")
    var board = this.board
    setTimeout(function() {
      expect(board.status).toBe("game-over")
      done()
    }, 5)
  })
})
