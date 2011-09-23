describe("Harness", function() {
  it("should support expectations", function() {
    expect(1+2).toEqual(3)
    expect(1+2).toBeLessThan(4)
  })

  it("should support asynchronous specifications", function() {
    wait()
    setTimeout(function() {
      expect(true).toBe(true)
      done()
    }, 1)
    expect(false).toBe(false)
  })
  
  describe("Dropit", function() {
    beforeEach(function() {
      request.target("http://" + DROPIT.host + ":" + DROPIT.port)
    })

    it("should respond to ping", function() {
      wait()
      get("/ping", function(error, response, body) {
        expect(response.statusCode).toBe(200)
        expect(body).toBe("PONG")
        done()
      })
    })

    it("should echo a plain/text message", function() {
      wait()
      post("/echo", {body: "Hello", headers: {"Content-Type": "plain/text"}}, function(error, response, body) {
        expect(response.statusCode).toBe(200)
        expect(body).toBe("Hello")
        done()
      })
    })

    it("should echo an application/json message", function() {
      wait()
      post("/echo", {json: {message: "Hello"}}, function(error, response, body) {
        expect(response.statusCode).toBe(200)
        expect(body).toEqual({message: "Hello"})
        done()
      })
    })
  })

  describe("Redis", function() {
    beforeEach(function() {
      global.redis = require("redis").createClient(REDIS.port, REDIS.host)
    })

    it("should echo a plain/text message", function() {
      wait()
      redis.set("foo", "bar", function(error) {
        redis.get("foo", function(error, value) {
          expect(value).toBe("bar")
          done()
        })
      })
    })
  })
})
