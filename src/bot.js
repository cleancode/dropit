var util = require("util"),
    Board = require("./board"),
    _ = require("underscore")


module.exports = (function(Bot) {
  
  Bot = function(timeToThink) {
    this.name = "bot"
    this.timeToThink = timeToThink
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
    var self = this
    board.on("over", function() {
      self.leaveFrom(board)  
    })
    if (this.timeToThink) {
      return setTimeout(function() {
        board.drop(self, Bot.pick())
      }, this.timeToThink)
    }
    board.drop(this, Bot.pick())
  }

  Bot.prototype.leaveFrom = function(board) {
    board.leave(this)
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
