var util = require("util"),
    Board = require("./board"),
    _ = require("underscore")


module.exports = (function(Bot) {
  
  Bot = function(board) {
    this.name = "bot"
  }

  Bot.prototype.join = function(board) {
    // TODO: join and wait until can be played then this.play()
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
