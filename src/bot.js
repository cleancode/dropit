var util = require("util"),
    Board = require("./board"),
    _ = require("underscore")


module.exports = (function(Bot) {
  
  Bot = function() {
    this.name = "bot"
  }

  Bot.prototype.join = function(board) {
    board.join(this)
    if (board.canBePlayed()) {
      return this.playOn(board)
    }
    var self = this
    board.once("join", function() {
      self.playOn(board)
    })
  }

  Bot.prototype.playOn = function(board) {
    board.drop(this, Bot.pick())
  }

  Bot.prototype.toJSON = function() {
    return {
      name: this.name
    }
  }

  Bot.pick = (function() {
    var symbols = Board.symbols(), numberOfSymbols = symbols.length
    return function() {
      return symbols[Math.floor(Math.random()*numberOfSymbols)]
    }
  })()

  return Bot
})()
