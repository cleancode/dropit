var util = require("util"),
    fs = require("fs"),
    cli = require("cli"),
    path = require("path"),
    daemon = require("daemon"),
    connect = require("connect"),
    Player = require("./src/player"),
    Board = require("./src/board"),
    Boards = require("./src/boards"),
    Scores = require("./src/scores"),
    Bot = require("./src/bot"),
    _ = require("underscore")


cli.parse({
  "host":  ["h", "Ip to bind to", "string", "0.0.0.0"],
  "port":  ["p", "Port to bind to", "number", 3030],
  "redis":  [false, "Redis port", "number"],
  "daemonize":  [false, "Make me a deamon", "boolean", false],
  "pid":  [false, "Path to pid file, required if daemonized", "path", "/tmp/dropit.pid"],
  "log":  [false, "Path to log file, required if daemonized", "path", "/tmp/dropit.log"]
})


cli.main(function(args, options) {
  if (!options.redis) {
    cli.fatal("--redis is required")
    cli.getUsage()
  }
  if (options.daemonize && (!options.pid || !options.log)) {
    cli.fatal("--pid and --log are required if --daemonize")
    cli.getUsage()
  }

  var boards = new Boards(), redis = require("redis").createClient(options.redis)

  connect.bodyParser.parse["plain/text"] = function(rawBody) { return rawBody }

  var server = connect(
    connect.query(),
    connect.bodyParser(),
    connect.router(function(resource) {
      resource.get("/whoami", function(request, response) {
        authenticate(request, response, function() {
          response.writeHead(200, {"content-type": "application/json"})
          response.end(JSON.stringify({player: request.player}))
        })
      })

      resource.get("/board/:id", function(request, response) {
        authenticate(request, response, function() {
          var board = boards.get(request.params.id)
          if (!board) {
            response.writeHead(404)
            return response.end()
          }
          response.writeHead(200, {"content-type": "application/json"})
          response.end(JSON.stringify({board: board}))
        })
      })
      resource.post("/board/:id/players", function(request, response) {
        authenticate(request, response, function() {
          var board = boards.get(request.params.id)
          if (!board) {
            response.writeHead(404)
            return response.end()
          }
          if (!board.join(request.player)) {
            response.writeHead(403)
            return response.end()
          }

          setTimeout(function() {
            board.timeout(request.player)
          }, request.query.waitForDrop || 30000)

          setTimeout(function() {
            (new Bot(request.query.timeToThink)).join(board)
          }, request.query.waitForJoin || 60000)

          response.writeHead(201, {"content-type": "application/json"})
          response.end(JSON.stringify({board: board}))
        })
      })
      resource.del("/board/:id/player/:name", function(request, response) {
        authenticate(request, response, function() {
          var board = boards.get(request.params.id)
          if (!board) {
            response.writeHead(404)
            return response.end()
          }
          if (request.player.name !== request.params.name) {
            response.writeHead(403)
            return response.end()
          }
          if (!board.leave(request.player)) {
            response.writeHead(404)
            return response.end()
          }
          response.writeHead(200)
          response.end()
        })
      })
      resource.post("/board/:id/drops", function(request, response) {
        authenticate(request, response, function() {
          var board = boards.get(request.params.id)
          if (!board) {
            response.writeHead(404)
            return response.end()
          }
          if (!board.drop(request.player, request.body.symbol)) {
            response.writeHead(403)
            return response.end()
          }
          response.writeHead(201, {"content-type": "application/json"})
          response.end(JSON.stringify({board: board}))
        })
      })

      resource.get("/boards", function(request, response) {
        authenticate(request, response, function() {
          response.writeHead(200, {"content-type": "application/json"})
          response.end(JSON.stringify({ boards: _(boards.joinable()).pluck("id") }))
        })
      })
      resource.post("/boards", function(request, response) {
        authenticate(request, response, function() {
          var joinable = boards.joinable()
          if (joinable.length < 5) {
            _(10).times(function() {
              joinable.push(boards.set(new Board()))
            })
            response.writeHead(201, {"content-type": "application/json"})
          } else {
            response.writeHead(303, {"content-type": "application/json"})
          }
          response.end(JSON.stringify({boards: joinable}))
        })
      })
      resource.del("/boards", function(request, response) {
        authenticate(request, response, function() {
          boards.reset()
          response.writeHead(200)
          response.end()
        })
      })

      resource.get("/player/:name/scores", function(request, response) {
        var player = new Player(request.params.name)
        ;(new Scores(redis)).forPlayer(player, function(error, scores) {
          response.writeHead(200, {"content-type": "application/json"})
          response.end(JSON.stringify({scores: scores}))
        })
      })
      resource.get("/scores/leaderboard", function(request, response) {
        (new Scores(redis)).leaderboard(function(error, leaderboard) {
          response.writeHead(200, {"content-type": "application/json"})
          response.end(JSON.stringify({leaderboard: leaderboard}))
        })
      })

      resource.get("/ping", function(request, response) {
        response.writeHead(200, {"content-type": "plain/text"})
        response.end("PONG")
      })
      resource.post("/echo", function(request, response) {
        response.writeHead(200, {"content-type": request.headers["content-type"]})
        response.end(request.rawBody)
      })

      _(["watch", "game", "leaderboard"]).each(function(page) {
        resource.get("/" + page, function(request, response, next) {
          request.url = request.url.replace("/" + page, "/html/" + page + ".html")
          next()
        })
      })
    }),
    connect["static"](path.join(__dirname, "public"))
  )

  var io = require("./lib/socket.io-channels")(
    require("socket.io").listen(server, {"log level": 0})
  )

  boards.on("create", function(board) {
    io.channel("/boards").emit("create", board)
    board.on("join", function(player) {
      io.channel("/board/" + board.id).emit("join", player, board)
    })
    board.on("drop", function(player, symbol) {
      io.channel("/board/" + board.id).emit("drop", player, symbol, board)
    })
    board.on("over", function(board) {
      (new Scores(redis)).score(board)
      io.channel("/board/" + board.id).emit("over", board)
    })
    board.on("leave", function(player) {
      io.channel("/board/" + board.id).emit("leave", player, board)
    })
    board.on("empty", function(board) {
      io.channel("/board/" + board.id).emit("empty", board)
      boards.del(board)
    })
  })

  server.listen(options.port, options.host)

  if (options.daemonize) {
    daemon.daemonize(options.log, options.pid, function(error, started) {
      if (error) {
        cli.fatal("unable to make him a daemon:" + error)
        console.dir(error.stack)
        process.exit(1)
      }
    })
  }



  function authenticate(request, response, callback) {
    if (request.headers["x-dropit-user"]) {
      var name = request.headers["x-dropit-user"]
      if (name === "bot") {
        response.writeHead(403)
        return response.end()
      }
      request.player = new Player(name)
      return callback(request, response)
    }
    response.writeHead(401)
    response.end()
  }
})
