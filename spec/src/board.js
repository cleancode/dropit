var Player = require("./../../src/player"),
    Board = require("./../../src/board")

describe("Board", function() {
  beforeEach(function() {
    this.p1 = new Player("p1")
    this.p2 = new Player("p2")
    this.p3 = new Player("p3")
    this.p4 = new Player("p4")
    this.p5 = new Player("p5")
    this.board = new Board()
  })

  describe("join", function() {
    it("should be a player after join", function() {
      this.board.join(this.p1)
      expect(this.board.isPlayer(this.p1)).toBe(true)
    })

    it("should not join the same player twice", function() {
      expect(this.board.join(this.p1)).toBe(true)
      expect(this.board.join(this.p1)).toBe(false)
    })

    it("should not join the same player twice when ready-to-play", function() {
      expect(this.board.join(this.p1)).toBe(true)
      expect(this.board.join(this.p2)).toBe(true)
      expect(this.board.join(this.p2)).toBe(false)
    })

    it("should not join more than two players", function() {
      expect(this.board.join(this.p1)).toBe(true)
      expect(this.board.join(this.p2)).toBe(true)
      expect(this.board.join(this.p3)).toBe(false)
      expect(this.board.join(this.p4)).toBe(false)
      expect(this.board.join(this.p5)).toBe(false)
    })
  })

  describe("drop", function() {
    it("should forbid to drop a symbol before ready-to-play", function() {
      expect(this.board.drop(this.p1, "spock")).toBe(false)

      this.board.join(this.p1)
      expect(this.board.drop(this.p1, "spock")).toBe(false)
    })

    it("should forbid to drop twice for the same player", function() {
      this.board.join(this.p1)
      this.board.join(this.p2)
      expect(this.board.drop(this.p1, "spock")).toBe(true)
      expect(this.board.drop(this.p1, "spock")).toBe(false)
    })

    it("should forbid to drop a symbol for a player not on board", function() {
      this.board.join(this.p1)
      this.board.join(this.p2)
      expect(this.board.drop(this.p3, "spock")).toBe(false)
    })

    it("should forbid to play an invalid symbol", function() {
      this.board.join(this.p1)
      this.board.join(this.p2)
      expect(this.board.drop(this.p1, "invalid")).toBe(false)
    })

    describe("lizard", function() {
      it("should win against spock", function() {
        this.board.join(this.p1)
        this.board.join(this.p2)
        this.board.drop(this.p1, "lizard")
        this.board.drop(this.p2, "spock")
        expect(this.board.score["p1"].result).toBe("win")
        expect(this.board.score["p2"].result).toBe("loose")
      })

      it("should loose against scissors", function() {
        this.board.join(this.p1)
        this.board.join(this.p2)
        this.board.drop(this.p1, "lizard")
        this.board.drop(this.p2, "scissors")
        expect(this.board.score["p1"].result).toBe("loose")
        expect(this.board.score["p2"].result).toBe("win")
      })
    })
  })

  describe("timeout", function() {
    xit("should drop for a player", function() {
      // TODO: make it pass
      this.board.join(this.p1)
      this.board.join(this.p2)
      this.board.timeout(this.p1)
      expect(this.board.drops["p1"]).toBe("timeout")
      expect(this.board.status).toBe("waiting-for-drop")
    })
    
    xit("should loose with every symbol", function() {
      // TODO: make it pass
      this.board.join(this.p1)
      this.board.join(this.p2)
      this.board.timeout(this.p1)
      this.board.drop(this.p2, "paper")
      expect(this.board.score["p1"].result).toBe("loose")
      expect(this.board.score["p1"].score).toBe(0)
      expect(this.board.score["p2"].result).toBe("win")
    })
    
    it("should not be a valid symbol", function() {
      expect(Board.symbols()).not.toContain("timeout")
    })
  })
})
