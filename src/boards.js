var util = require("util"),
    EventEmitter = require("events").EventEmitter,
    _ = require("underscore")


module.exports = (function(Boards) {

  Boards = function() {
    this.boards = {}
    EventEmitter.call(this)
  }

  util.inherits(Boards, EventEmitter)

  Boards.prototype.set = function(board) {
    if (!this.boards[board.id]) {
      this.boards[board.id] = board
      this.emit("create", board)
      return board
    }
  }

  Boards.prototype.get = function(id) {
    return this.boards[id]
  }

  Boards.prototype.del = function(board) {
    if (this.boards[board.id]) {
      delete this.boards[board.id]
      this.emit("delete", board)
      return board
    }
  }

  Boards.prototype.reset = function() {
    _(this.boards).each(function(board) {
      this.del(board.id)
    }, this)
    this.boards = {}
  }

  Boards.prototype.joinable = function() {
    return _(this.boards).select(function(board) { return board.canBeJoined() })
  }
  
  return Boards
})()
