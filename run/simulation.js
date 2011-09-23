var util = require("util"),
    cli = require("cli"),
    url = require("url"),
    Bot = require("./../src/bot"),
    EventEmitter = require("events").EventEmitter,
    io = require("socket.io-client"),
    request = require("request"),
    _ = require("underscore")


module.exports.SimulatedPlayer = (function(SimulatedPlayer) {
 
  SimulatedPlayer = function(name, options) {
    this.name = name
    this.socket = null
    this.options = options || {}
    this.games = this.options.games || 5
    this.host = this.options.host || "127.0.0.1"
    this.port = this.options.port || 80
    this.target = url.format({protocol: "http", hostname: this.host, port: this.port})
    EventEmitter.call(this)
  }

  util.inherits(SimulatedPlayer, EventEmitter)

  SimulatedPlayer.prototype.play = function(callback) {
    var self = this
    waitBetween(function() { 
      self.connect(function() {
        // TODO: implement me
      })
    }, 50, 5000)
  }

  SimulatedPlayer.prototype.dropSymbolOn = function(board, callback) {
    // TODO: implement me
  }

  SimulatedPlayer.prototype.leaveFrom = function(board, callback) {
    // TODO: implement me
  }



  SimulatedPlayer.prototype.connect = function(callback) {
    var self = this
    if (!self.socket) {
      return _(io.connect(self.target, {"reconnect": true, "force new connection": true})).tap(function(socket) {
        self.log("==", "waiting to connect to " + self.target)
        socket.on("connect", function() {
          self.log("<<", "connected to " + self.target)
          self.socket = socket
          callback()
        })
      })
    }
    callback()
  }

  SimulatedPlayer.prototype.disconnect = function(callback) {
    if (!this.socket) {
      return callback()
    }
    this.socket.once("disconnect", callback)
    this.socket.disconnect()
  }

  SimulatedPlayer.prototype.subscribe = function(board, callback) {
    var self = this
    self.socket.emit("subscribe", "/board/" + board.id, function(channels) {
      self.socket.on("join", function(player, board) {
        self.log("<<", "join " + player.name)
        if (board.status === "ready-to-play") {
          self.emit("play", board)
        }
      })
      self.socket.on("drop", function(player, symbol, board) {
        self.log("<<", "drop " + player.name + ":" + symbol)
      })
      self.socket.on("over", function(board) {
        self.log("<<", "over " + JSON.stringify(board.score))
        self.emit("over", board)
      })
      self.socket.on("leave", function(player, board) {
        self.log("<<", "leave " + player.name)
      })
      self.socket.on("empty", function(board) {
        self.log("<<", "all players has been leaved")
        self.unsubscribe(board, function() {
          self.emit("again")
        })
      })
      callback(board)
    })
  }

  SimulatedPlayer.prototype.unsubscribe = function(board, callback) {
    var self = this
    _(["join", "drop", "over", "leave", "empty"]).each(function(event) {
      self.socket.removeAllListeners(event)
    })
    self.removeAllListeners("play")
    self.socket.emit("unsubscribe", "/board/" + board.id, callback)
  }

  SimulatedPlayer.prototype.log = function(direction, message) {
    if (this.options.verbose) {
      util.log(["[", this.name, "]", " ", direction, " ", _(message).isString() ? message : JSON.stringify(message)].join(""))
    }
  }

  _({get: "GET", post: "POST", put: "PUT", del: "DELETE"}).each(function(method, name) {
    SimulatedPlayer.prototype[name] = function(pathname, options, callback) {
      if (_(options).isFunction()) { callback = options; options = {} }
      if (_(options).isUndefined()) { options = {} }
      options.method = method
      this.request(pathname, options, callback)
    }
  })

  SimulatedPlayer.prototype.request = function(pathname, options, callback) {
    var self = this
    options.uri = self.target + pathname
    options.headers = options.headers || {}
    options.headers["x-dropit-user"] = self.name
    self.log(">>", options.method + " " + pathname)
    if (options.json) {
      self.log(">>", "\t" + JSON.stringify(options.json))
    }
    request(options, function(error, response, body) {
      if (error) self.log("!!", error)
      body = _(body).isString() ? body : JSON.stringify(body)
      self.log("<<", response.statusCode + (_(body).isEmpty() ? "" : (": " + body)))
      if (callback) callback(error, response, body)
    })
  }

  function waitBetween(callback, from, to) {
    setTimeout(callback, Math.random()*(to-from)+from)
  }

  return SimulatedPlayer
})()
