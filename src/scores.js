var _ = require("underscore")


_.mixin({
  eachSlice: function(obj, iterator, length, context) {
    if (!_.isFunction(obj.slice)) return iterator(obj)
    var from = 0, to = length
    while (from < obj.length) {
      iterator.call(context, obj.slice(from, to), obj, length)
      from = to; to = Math.min(to+length, obj.length)
    }
  },
  splat: function(obj, callback, context) {
    return callback.apply(context, [].concat(Array.prototype.slice.call(obj)))
  }
})



module.exports = (function(Scores) {

  Scores = function(redis) {
    this.redis = redis
  }
  
  Scores.prototype.score = function(board, callback) {
    var commands = _(board.players).reduce(function(commands, player) {
      if (player.name === "bot") return commands
      var key = "/player/" +  player.name,
          result = board.score[player.name]

      commands.push(["hincrby", key, "games", 1])
      commands.push(["hincrby", key, "score", result.score])
      commands.push(["zincrby", "/leaderboard", result.score, player.name])
      commands.push(["sadd", "/players", player.name])
      return commands
    }, [])
    commands.push(["incr", "/games"])
    this.redis.multi(commands).exec(callback)
  }

  Scores.prototype.forPlayer = function(player, callback) {
    var key = "/player/" + player.name
    this.redis.hgetall(key, function(error, scores) {
      _(scores).each(function(value, key) {
        scores[key] = parseInt(value, 10)
      })
      callback(error, scores)
    })
  }

  Scores.prototype.total = function(callback) {
    this.redis.multi([["get", "/games"], ["scard", "/players"]]).exec(function(error, results) {
      _(results).splat(function(games, players) {
        callback(error, {
          games: parseInt(games, 10),
          players: parseInt(players, 10)
        })
      })
    })
  }

  Scores.prototype.leaderboard = function(callback) {
    this.redis.zrevrange("/leaderboard", 0, 19, "WITHSCORES", function(error, result) {
      var leaderboard = []
      _(result).eachSlice(function(slice) {
        _(slice).splat(function(player, score) {
          leaderboard.push({player: player, score: parseInt(score, 10)})
        })
      }, 2)
      callback(error, leaderboard)
    })
  }

  return Scores
})()
