var util = require("util"),
    uuid = require("node-uuid"),
    EventEmitter = require("events").EventEmitter,
    _ = require("underscore")


module.exports = (function(Board) {

  var SYMBOLS = ["rock", "scissors", "paper", "lizard", "spock", "timeout"]
  var RULES = {
    "lizard": ["paper", "spock", "timeout"],
    "spock": ["scissors", "rock", "timeout"],
    "scissors": ["lizard", "paper", "timeout"],
    "rock": ["scissors", "lizard", "timeout"],
    "paper": ["spock", "rock", "timeout"]
  }

  Board = function() {
    this.id = uuid()
    this.drops = {}
    this.players = {}
    this.score = {}
    this.status = "waiting-for-players"
    EventEmitter.call(this)
  }

  util.inherits(Board, EventEmitter)

  Board.prototype.join = function(player) {
    var numberOfPlayers = this.numberOfPlayers()
    if (numberOfPlayers > 1) {
      return false
    }
    if (this.isPlayer(player)) {
      return false
    }
    if (numberOfPlayers === 1) {
      this.players[player.name] = player
      this.status = "ready-to-play"
      this.emit("join", player)
      return true
    }
    if (numberOfPlayers === 0) {
      this.players[player.name] = player
      this.status = "waiting-for-player"
      this.emit("join", player)
      return true
    }
    return false
  }

  Board.prototype.leave = function(player) {
    if (!this.canBeLeaved()) {
      return false
    }
    if (!this.isPlayer(player)) {
      return false
    }
    delete this.players[player.name]
    this.emit("leave", player)
    if (this.numberOfPlayers() === 0) {
      this.status = "empty"
      this.emit("empty", this)
    }
    return true
  }

  Board.prototype.timeout = function(player) {
    return this.drop(player, "timeout")
  }

  Board.prototype.drop = function(player, symbol) {
    if (!this.canBePlayed() || !this.canPlay(player) || !this.isValidSymbol(symbol)) {
      return false
    }
    if (this.status === "ready-to-play") {
      this.status = "waiting-for-drop"
      this.drops[player.name] = symbol
      this.emit("drop", player, symbol)
      return true
    }
    if (this.status === "waiting-for-drop") {
      this.status = "game-over"
      this.drops[player.name] = symbol
      this.emit("drop", player, symbol)
      this.winner = player.name
      this.checkout()
      this.emit("over", this)
      return true
    }
    return false
  }

  Board.prototype.checkout = function() {
    if (this.drops.length < 2) return null
    var symbols = _(this.drops).values(),
        players = _(this.drops).keys()

    if (symbols[0] === symbols[1]) {
      this.score[players[0]] = {score: 2, result: "tie"}
      this.score[players[1]] = {score: 2, result: "tie"}
      return;
    }
    if (_(RULES[symbols[0]]).contains(symbols[1])) {
      this.score[players[0]] = {score: 5, result: "win"}
      this.score[players[1]] = {score: (symbols[1] === "timeout") ? 0 : 1, result: "loose"}
      return;
    }
    if (_(RULES[symbols[1]]).contains(symbols[0])) {
      this.score[players[1]] = {score: 5, result: "win"}
      this.score[players[0]] = {score: (symbols[0] === "timeout") ? 0 : 1, result: "loose"}
      return;
    }
  }

  Board.prototype.toJSON = function() {
    return {
      id: this.id,
      status: this.status,
      players: _(this.players)
        .chain()
        .values()
        .map(function(player) { 
          return player.toJSON() 
        })
        .value(),
      drops: this.drops,
      score: this.score
    }
  }

  Board.prototype.numberOfPlayers = function() {
    return _(this.players).keys().length
  }

  Board.prototype.canPlay = function(player) {
    return this.isPlayer(player) && !this.hasAlreadyPlayed(player)
  }

  Board.prototype.isPlayer = function(player) {
    return !!_(this.players).detect(function(playerOnBoard) {
      return playerOnBoard.name === player.name
    })
  }

  Board.prototype.hasAlreadyPlayed = function(player) {
    return !!this.drops[player.name]
  }

  Board.prototype.canBeLeaved = function() {
    return this.status === "game-over"
  }

  Board.prototype.canBePlayed = function() {
    return _(["ready-to-play", "waiting-for-drop"]).contains(this.status)
  }

  Board.prototype.canBeJoined = function() {
    return _(["waiting-for-players", "waiting-for-player"]).contains(this.status)
  }

  Board.prototype.isValidSymbol = function(symbol) {
    return _(SYMBOLS).contains(symbol)
  }

  Board.symbols = function() {
    return _(SYMBOLS).without("timeout")
  }

  return Board
})()
