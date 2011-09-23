var fs = require("fs"),
    url = require("url"),
    path = require("path"),
    async = require("async"),
    http = require("http"),
    request = require("request"),
    Handlebars = require("handlebars"),
    _ = require("underscore")

jake = require("./lib/jake-spawner")(jake)

var ROOT_DIRECTORY = path.normalize(__dirname)
var WORK_DIRECTORY = path.join(ROOT_DIRECTORY, ".work")
var RUN_DIRECTORY = path.join(WORK_DIRECTORY, "pid")
var DB_DIRECTORY = path.join(WORK_DIRECTORY, "db")
var LOG_DIRECTORY = path.join(WORK_DIRECTORY, "log")

var DROPIT = {
  root: ROOT_DIRECTORY,
  pid: path.join(RUN_DIRECTORY, "dropit.pid"),
  log: path.join(LOG_DIRECTORY, "dropit.log"),
  host: "0.0.0.0",
  port: 3030
}

var REDIS = {
  root: DB_DIRECTORY,
  pid: path.join(RUN_DIRECTORY, "redis.pid"),
  log: path.join(LOG_DIRECTORY, "redis.log"),
  host: "127.0.0.1",
  port: 3031
}


desc("Prepare work environment")
task("lint", function() {
  var jshint = require("jshint").JSHINT,
      fileToLint = new jake.FileList()
 
  fileToLint.include(path.join(ROOT_DIRECTORY, "src/*.js"))
  fileToLint.include(path.join(ROOT_DIRECTORY, "spec/src/*.js"))
  fileToLint.include(path.join(ROOT_DIRECTORY, "spec/helper/*.js"))
  fileToLint.include(path.join(ROOT_DIRECTORY, "server.js"))
  async.series(
    _(fileToLint.toArray()).map(function(path) {
      return function(next) {
        fs.readFile(path, function(error, data) {
          if (!jshint(data.toString(), {asi: true, laxbreak: false, sub: true})) {
            console.log("File " + path + ":")
            _(jshint.data().errors).each(function(error) {
              console.log("\t" + error.reason + " -- " + error.line + ":" + error.character + " -> " + error.evidence.trim())
            })
            return next("lint")
          }
          next()
        })
      }
    }),
    function(error) {
      if (error) fail(error)
      complete()
    }
  )
}, true)


desc("Prepare work environment")
task({"prepare": ["lint"]}, function() {
  async.series([
    function(next) { fs.mkdir(WORK_DIRECTORY, 0777, function() { next() }) },
    function(next) { fs.mkdir(RUN_DIRECTORY, 0777, function() { next() }) },
    function(next) { fs.mkdir(DB_DIRECTORY, 0777, function() { next() }) },
    function(next) { fs.mkdir(LOG_DIRECTORY, 0777, function() { next() }) }
  ], 
  function(error) {
    if (error) fail(error)
    complete()
  })
}, true)


desc("Start all services")
task({"start": ["prepare"]}, function() {
  async.series([
      function(next) { jake.start("redis", next) },
      function(next) { jake.start("dropit", next) }
    ], 
    function(error) {
      if (error) fail(error)
      complete()
    }
  )
}, true)


desc("Stop all services")
task({"stop": ["prepare"]}, function() {
  async.parallel([
      function(next) { jake.stop("redis", next) },
      function(next) { jake.stop("dropit", next) }
    ],
    function(error) {
      if (error) fail(error)
      complete()
    }
  )
}, true)


desc("Clean all artifacts")
task({"clean": ["stop"]}, function() {
  fs.rmrfdir = require("rimraf")
  fs.rmrfdir(WORK_DIRECTORY, complete)
}, true)


desc("Run all specs")
task({"spec": ["stop", "start"]}, function() {
  var path = require("path"),
      jasmine = require("./spec/lib/jasmine-node"),
      specFolderPath = path.join(ROOT_DIRECTORY, "spec", "src"),
      showColors = true,
      isVerbose = true,
      filter = /\.js$/

  DROPIT.url = "http://" + DROPIT.host + ":" + DROPIT.port
  jasmine.DROPIT = DROPIT
  jasmine.REDIS = REDIS

  if (arguments.length > 0) {
    filter = new RegExp(
      _(Array.prototype.slice.call(arguments, 0)).map(function(suite) {
        return suite + "\\.js$"
      }).join("|")
    )
  }

  jasmine = require("./spec/lib/jasmine-request")(jasmine)
  jasmine.request.target(DROPIT.url)

  for (var key in jasmine) global[key] = jasmine[key]
  jasmine.executeSpecsInFolder(specFolderPath, function(runner, log) {
    process.exit(runner.results().failedCount)
  }, isVerbose, showColors, filter)
})



jake.service("redis", function(redis) {
  var configurationFileSource = path.join(ROOT_DIRECTORY, "etc", "development", "redis.conf"),
      configurationFile = path.join(WORK_DIRECTORY, "redis.conf")

  redis.start = function(callback) {
    fs.readFile(configurationFileSource, function(error, data) {
      fs.writeFile(configurationFile, Handlebars.compile(data.toString("utf8"))({redis: REDIS}), function(error) {
        jake.sh("redis-server", configurationFile, function(error, ok) {
          jake.waitUntil(_(redis.ping).bind(redis), callback, 2500)
        })
      })
    })
  }

  redis.stop = function(callback) {
    jake.kill(REDIS.pid)
    jake.waitWhile(_(redis.ping).bind(redis), callback, 2500)
  }

  redis.ping = function(callback) {
    jake.sh("redis-cli", "-p", REDIS.port, "PING", function(error, ok) {
      callback(null, ok)
    })
  }
})


jake.service("dropit", function(dropit) {
  dropit.start = function(callback) {
    jake.node("server.js", "-p", DROPIT.port, "--redis", REDIS.port, "--daemonize", "--pid", DROPIT.pid, "--log", DROPIT.log, function(error, process) {
      jake.waitUntil(_(dropit.ping).bind(dropit), callback, 2500)
    })
  }

  dropit.stop = function(callback) {
    jake.kill(DROPIT.pid)
    jake.waitWhile(_(dropit.ping).bind(dropit), callback, 2500)
  }

  dropit.ping = function(callback) {
    request(["http://", DROPIT.host, ":", DROPIT.port, "/ping"].join(""), function(error, response, body) {
      callback(null, !error && (response && response.statusCode === 200))
    })
  }
})
