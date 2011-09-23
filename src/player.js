module.exports = (function(Player) {
  
  Player = function(name) {
    this.name = name
  }

  Player.prototype.toJSON = function() {
    return {
      name: this.name
    }
  }

  return Player
})()
