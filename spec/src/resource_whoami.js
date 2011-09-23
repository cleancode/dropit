describe("/whoami", function() {
  describe("GET /whoami", function() {
    it("should identify the current player", function() {
      wait()
      login("p1", function(p1) {
        p1.get("/whoami", function(error, response, body) {
          expect(response.statusCode).toBe(200)
          expect(JSON.parse(body).player.name).toBe("p1")
          done()
        })
      })
    })

    it("should be forbidden for player 'bot'", function() {
      wait()
      login("bot", function(bot) {
        bot.get("/whoami", function(error, response, body) {
          expect(response.statusCode).toBe(403)
          done()
        })
      })
    })
  })
})
