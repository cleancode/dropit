var request = require("request"),
    _ = require("underscore"),
    path = require("path")


module.exports = function(jasmine) {

  var target = "http://example.com", user = null

  jasmine.request = function(pathname, options, callback) {
    options.uri = target + pathname
    request(options, callback)
  }

  jasmine.request.target = function(url) {
    target = url
  }

  jasmine.login = function(username, callback) {
    _({}).tap(function(user) {
      _(["get","post","put","del"]).each(function(method) {
        user.name = username
        user[method] = function(pathname, options, callback) {
          if (_(options).isFunction()) { callback = options; options = {} }
          options.headers = options.headers || {}
          options.headers["x-dropit-user"] = username
          jasmine[method](pathname, options, callback)
        }
      })
      callback(user)
    })
  }

  _({get: "GET", post: "POST", put: "PUT", del: "DELETE"}).each(function(method, name) {
    jasmine[name] = function(pathname, options, callback) {
      if (_(options).isFunction()) { callback = options; options = {} }
      options.method = method
      jasmine.request(pathname, options, callback)
    }
  })

  return jasmine
}
