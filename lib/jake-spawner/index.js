var fs = require("fs"),
    path = require("path"),
    spawn = require("child_process").spawn,
    _ = require("underscore")


module.exports = function(jake) {

  var services = {}, root = path.normalize(path.join(__dirname, "..", ".."))

  jake.service = function(name, define) {
    services[name] = _({}).tap(function(service) {
      try {
        define(service)
      } catch(exception) {
        console.error(exception)
      }
    })
  }

  jake.start = function(name, callback) {
    jake.command(name, "ping", function(error, ok) {
      if (ok) {
        return callback(null, true)
      }
      jake.command(name, "start", callback)
    })
  }

  jake.stop = function(name, callback) {
    jake.command(name, "stop", callback)
  }

  jake.command = function(name, command, callback) {
    var service = services[name]
    if (!service) throw new Error("unable to find service " + name)
    if (!service[command] || !_(service[command]).isFunction()) {
      throw new Error("unable to find command " + command + " for service " + name)
    }
    service[command](callback)
  }

  jake.node = function() {
    var script = Array.prototype.slice.call(arguments, 0, 1),
        options = Array.prototype.slice.call(arguments, 1, arguments.length - 1),
        callback = Array.prototype.pop.call(arguments)
    if (!_(callback).isFunction()) throw new Error("last argument should be a function")
    jake.sh("bash", "-c", ["node", script].concat(options).join(" "), callback) 
  }

  jake.sh = function() {
    var executable = Array.prototype.slice.call(arguments, 0, 1)[0],
        options = Array.prototype.slice.call(arguments, 1, arguments.length - 1),
        callback = Array.prototype.pop.call(arguments)
    if (!_(callback).isFunction()) throw new Error("last argument should be a function")
    _(spawn(executable, options, {cwd: root})).tap(function(spawned) {
      var stderr = ""
      spawned.stderr.on("data", function(data) { stderr += data.toString("utf8") })
      spawned.on("exit", function(code) {
        if (!_(stderr).isEmpty()) {
          return callback(stderr, false)
        }
        callback(null, code === 0)
      })
    })
  }

  jake.kill = function(path) {
    fs.readFile(path, function(error, data) {
      try {
        process.kill(parseInt(data.toString("utf8"), 10))
      } catch(exception) {
        // do nothing
      }
    })
  }

  jake.root = function(path) {
    root = path
  }

  jake.waitWhile = function(test, callback, timeout) {
    jake.waitUntil(function(callback) {
      test(function(error, ok) {
        callback(error, !ok)
      })
    }, callback, timeout)
  }

  jake.waitUntil = function(test, callback, timeout) {
    var start = new Date().getTime()
    test(function(error, ok) {
      if (error) return callback(error)
      if (ok) return callback(null, ok)
      setTimeout(function() {
        var stop = new Date().getTime()
        timeout -= (stop-start)
        if (timeout <= 0) return callback("timeout")
        jake.waitUntil(test, callback, timeout)
      }, 25)
    })
  }

  return jake
}
