describe("/board", function() {
  var dropit = require("../helper/api.js")({})

  afterEach(function() {
    // TODO: remove all boards, leave it clean
  })

  describe("POST /board/:id/players", function() {
    it("should join a player to an empty board", function() {
      // TODO: board should be in waiting-for-player
    })

    it("should join a player to a board with a player", function() {
      // TODO: board should be in ready-to-play
    })

    it("should not join a player to a board with two players", function() {
      // TODO: board should be still in ready-to-play -> 403
    })

    it("should remove a board from available boards when two players join", function() {
      // TODO: GET /boards should not contain board
    })
  })

  describe("POST /board/:id/drops", function() {
    it("should drop a symbol for a player", function() {
      // TODO: 201 board in waiting-for-drop
    })

    it("should end the game after the drop of the second player", function() {
      // TODO: 201 board in game-over
    })
  })
})
