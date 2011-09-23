var _ = require("underscore")._

module.exports = function(io) {
  
  var channels = {}, subscriptions = {}

  io.sockets.on("connection", function(socket) {
    socket.on("subscribe", function(channel, callback) {
      try {
        if (!channels[channel]) channels[channel] = []
        if (!subscriptions[socket.id]) subscriptions[socket.id] = []
        if (channels[channel].indexOf(socket.id) < 0) {
          channels[channel].push(socket.id)
        }
        if (subscriptions[socket.id].indexOf(channel) < 0) {
          subscriptions[socket.id].push(channel)
        }
      } catch(e) {
        console.log(e)
      }
      if (callback) callback(subscriptions[socket.id])
    })
    socket.on("unsubscribe", function(channel, callback) {
      channels[channel] = _(channels[channel]).without(socket.id)
      subscriptions[socket.id] = _(subscriptions[socket.id]).without(channel)
      if (callback) callback(subscriptions[socket.id])
    })
    socket.on("disconnect", function() {
      var subscribed = subscriptions[socket.id], length = (subscribed && subscribed.length) || 0
      for (var i=0; i<length; i++) {
        channels[subscribed[i]] = _(channels[subscribed[i]]).without(socket.id)
      }
      delete subscriptions[socket.id]
    })
  })

  io.channel = function(name) {
    var ids = channels[name] || [], length = ids.length
    var sockets = io.sockets.sockets
    return {
      emit: function() {
        for (var i=0; i<length; i++) {
          sockets[ids[i]].emit.apply(sockets[ids[i]], arguments)
        }
      }
    }
  }

  return io
}
