var util = require("util"),
    fs = require("fs"),
    cli = require("cli"),
    daemon = require("daemon"),
    connect = require("connect"),
    Player = require("./src/player"),
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

      resource.get("/ping", function(request, response) {
        response.writeHead(200, {"Content-Type": "plain/text"})
        response.end("PONG")
      })
      resource.post("/echo", function(request, response) {
        console.log(request.headers, request.body, request.rawBody)
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
