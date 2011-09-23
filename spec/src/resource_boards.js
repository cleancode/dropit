var _ = require("underscore")

describe("/boards", function() {
  afterEach(function() {
    wait()
    login("p1", function(p1) {
      p1.del("/boards", function(error, response, body) {
        expect(response.statusCode).toBe(200)
        done()
      })
    })
  })

  describe("POST /boards", function() {
    it("should create a board when is empty", function() {
      wait()
      login("p1", function(p1) {
        p1.post("/boards", function(error, response, body) {
          var boards = JSON.parse(body).boards
          expect(response.statusCode).toBe(201)
          expect(boards.length).toBeGreaterThan(0)
          done()
        })
      })
    })

    it("should get a board when is not empty", function() {
      wait()
      login("p1", function(p1) {
        p1.post("/boards", function(error, response, body) {
          expect(response.statusCode).toBe(201)
          p1.post("/boards", function(error, response, body) {
            var boards = JSON.parse(body).boards
            expect(response.statusCode).toBe(303)
            expect(boards.length).toBeGreaterThan(0)
            done()
          })
        })
      })
    })
  })

  describe("GET /boards", function() {
    it("should get all available borards", function() {
      wait()
      login("p1", function(p1) {
        p1.post("/boards", function(error, response, body) {
          expect(response.statusCode).toBe(201)
          var boards = JSON.parse(body).boards
          p1.get("/boards", function(error, response, body) {
            _(boards).each(function(board) {
              expect(JSON.parse(body).boards).toContain(board.id)
            })
            done()
          })
        })
      })
    })
  })
})
