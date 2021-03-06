const router       = require('router')
const Route        = require('./route')
const createServer = require('./server')
const routeHandler = require('./handler')
const assign       = require('lodash').assign
const Emitter      = require('events').EventEmitter

module.exports = Rocky

function Rocky(opts) {
  opts = opts || { xfwd: true }
  this.opts    = opts
  this.replays = []
  this.router  = router(opts.router)
  Emitter.call(this)
}

Rocky.prototype = Object.create(Emitter.prototype)

Rocky.prototype.target  =
Rocky.prototype.forward = function (url) {
  this.opts.target = url
  return this
}

Rocky.prototype.replay = function (url, opts) {
  return Route.prototype.replay.call(this, url, opts)
}

Rocky.prototype.options = function (opts) {
  assign(this.opts, opts)
  return this
}

Rocky.prototype.use = function () {
  this.router.use.apply(this.router, arguments)
  return this
}

Rocky.prototype.requestHandler = function (req, res, next) {
  this.router(req, res, next || function () {})
  return this
}

Rocky.prototype.middleware = function () {
  return this.requestHandler.bind(this)
}

Rocky.prototype.balance = function (urls) {
  if (Array.isArray(urls)) {
    this.opts.balance = urls
  }
  return this
}

Rocky.prototype.listen = function (port, host) {
  var opts = { ssl: this.opts.ssl, port: port, host: host }
  var handler = this.requestHandler.bind(this)
  this.server = createServer(opts, handler)
  return this
}

Rocky.prototype.close = function (cb) {
  if (this.server) {
    this.server.close(cb)
  }
  return this
}

;['get', 'post', 'delete', 'patch', 'put', 'head', 'all'].forEach(function (method) {
  Rocky.prototype[method] = function (path) {
    var route = new Route(path)
    var handler = routeHandler(this, route)
    this.router[method](path, handler)
    return route
  }
})
