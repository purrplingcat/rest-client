const { resolveUid } = require("./DataResolver")
const noop = () => {} // eslint-disable-line no-empty-function
const methods = ["get", "post", "delete", "patch", "put"]
const reflectors = [
  "toString", "valueOf", "inspect", "constructor", "call",
  Symbol.toPrimitive, Symbol.for("util.inspect.custom"), Symbol("util.inspect.custom")
]

if (typeof util !== "undefined") { // eslint-disable-line
  reflectors.push(util.inspect.custom) // eslint-disable-line no-undef
}

function makeRequestFor (rest, method, endpoint) {
  switch (method) {
    case "get":
      return (query = null, args = {}) => rest.get(endpoint, query, args)
    case "post":
      return (data, query = null, args = {}) => rest.post(endpoint, data, query, args)
    case "patch":
      return (data, query = null, args = {}) => rest.patch(endpoint, data, query, args)
    case "delete":
      return (query = null, args = {}) => rest.delete(endpoint, query, args)
    default:
      return (args = {}) => rest.request(method, endpoint, args)
  }
}

function buildRoute (rest) {
  const route = [""]
  const handler = {
    get (target, name) {
      if (reflectors.includes(name)) return () => route.join("/")
      if (methods.includes(name)) {
        return makeRequestFor(rest, name, route.join("/"))
      }
      route.push(name.toString())
      return new Proxy(noop, handler)
    },
    apply (target, _, args) {
      route.push(...args.filter(x => x != null).map(x => encodeURIComponent(x))) // eslint-disable-line eqeqeq
      return new Proxy(noop, handler)
    }
  }
  return new Proxy(noop, handler)
}

module.exports = buildRoute
