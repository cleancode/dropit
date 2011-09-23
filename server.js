var util = require("util"),
    fs = require("fs"),
    cli = require("cli"),
    daemon = require("daemon"),
    connect = require("connect"),
    Player = require("./src/player"),
    Board = require("./src/board"),
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

  var boards = {}

  connect.bodyParser.parse["plain/text"] = function(rawBody) { return rawBody }

  connect(
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
          var board = boards[request.params.id]
          if (!board) {
            response.writeHead(404)
            return response.end()
          }
          if (!board.join(request.player)) {
            response.writeHead(403)
            return response.end()
          }
          response.writeHead(201, {"content-type": "application/json"})
          response.end(JSON.stringify({board: board}))
        })
      })
      resource.post("/board/:id/drops", function(request, response) {
        authenticate(request, response, function() {
          var board = boards[request.params.id]
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
          response.end(JSON.stringify({ boards: _(joinable(boards)).pluck("id") }))
        })
      })
      resource.post("/boards", function(request, response) {
        authenticate(request, response, function() {
          var joinableBoards = joinable(boards)
          if (joinableBoards.length === 0) {
            var board = new Board()
            boards[board.id] = board
            joinableBoards.push(board)
            response.writeHead(201, {"content-type": "application/json"})
          } else {
            response.writeHead(303, {"content-type": "application/json"})
          }
          response.end(JSON.stringify({boards: joinableBoards}))
        })
      })
      resource.del("/boards", function(request, response) {
        authenticate(request, response, function() {
          boards = {}
          response.writeHead(200)
          response.end()
        })
      })

      resource.get("/ping", function(request, response) {
        response.writeHead(200, {"Content-Type": "plain/text"})
        response.end("PONG")
      })
      resource.post("/echo", function(request, response) {
        response.writeHead(200, {"Content-Type": request.headers["content-type"]})
        response.end(request.rawBody)
      })
    })
  ).listen(options.port, options.host)

  if (options.daemonize) {
    daemon.daemonize(options.log, options.pid, function(error, started) {
      if (error) {
        cli.fatal("unable to make him a daemon:" + error)
        console.dir(error.stack)
        process.exit(1)
      }
    })
  }



  function joinable(boards) {
    return _(boards).select(function(board) { return board.canBeJoined() })
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
