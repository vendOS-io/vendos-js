/*
 * @license
 * vendOS v2.0.2
 * (c) 2020 Social Vend Ltd. trading as vendOS
 * Released under the MIT license
 * vendos.io
 */

var domain;

// This constructor is used to store event handlers. Instantiating this is
// faster than explicitly calling `Object.create(null)` to get a "clean" empty
// object (tested with v8 v4.9).
function EventHandlers() {}
EventHandlers.prototype = Object.create(null);

function EventEmitter() {
  EventEmitter.init.call(this);
}

// nodejs oddity
// require('events') === require('events').EventEmitter
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.usingDomains = false;

EventEmitter.prototype.domain = undefined;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

EventEmitter.init = function() {
  this.domain = null;
  if (EventEmitter.usingDomains) {
    // if there is an active domain, then attach to it.
    if (domain.active ) ;
  }

  if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
    this._events = new EventHandlers();
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events, domain;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  domain = this.domain;

  // If there is no 'error' event listener then throw.
  if (doError) {
    er = arguments[1];
    if (domain) {
      if (!er)
        er = new Error('Uncaught, unspecified "error" event');
      er.domainEmitter = this;
      er.domain = domain;
      er.domainThrown = false;
      domain.emit('error', er);
    } else if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
    // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
    // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = new EventHandlers();
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] :
                                          [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' ' + type + ' listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        emitWarning(w);
      }
    }
  }

  return target;
}
function emitWarning(e) {
  typeof console.warn === 'function' ? console.warn(e) : console.log(e);
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function _onceWrap(target, type, listener) {
  var fired = false;
  function g() {
    target.removeListener(type, g);
    if (!fired) {
      fired = true;
      listener.apply(target, arguments);
    }
  }
  g.listener = listener;
  return g;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || (list.listener && list.listener === listener)) {
        if (--this._eventsCount === 0)
          this._events = new EventHandlers();
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length; i-- > 0;) {
          if (list[i] === listener ||
              (list[i].listener && list[i].listener === listener)) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (list.length === 1) {
          list[0] = undefined;
          if (--this._eventsCount === 0) {
            this._events = new EventHandlers();
            return this;
          } else {
            delete events[type];
          }
        } else {
          spliceOne(list, position);
        }

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = new EventHandlers();
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        for (var i = 0, key; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = new EventHandlers();
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        do {
          this.removeListener(type, listeners[listeners.length - 1]);
        } while (listeners[0]);
      }

      return this;
    };

EventEmitter.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, i) {
  var copy = new Array(i);
  while (i--)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

const VENDOS_WEBSOCKET_URL = 'ws://fieldcommand:8080';

const CONSOLE_STYLES = {
  INFO: 'background: #021019; color: #03FFCF; padding: 5px 10px; border-radius: 2px',
  ERROR: 'background: #021019; color: #D44242; padding: 5px 10px; border-radius: 2px',
};

const CONSOLE_PREFIX = 'VendOS SDK';

const CONNECTION_ATTEMPT_INTERVAL = 100;
const CONNECTION_ATTEMPT_LIMIT = 5;

const DEVTOOLS_URL = '[URL]';
const DEVTOOLS_FLAG = '__VENDOS_DEVTOOLS_EXTENSION__';
const FIELD_COMMAND_FLAG = '__VENDOS_FIELD_COMMAND_VERSION__';
const MACHINE_HOSTNAME = 'fieldcommandui';

const MESSAGES = {

  WEBSOCKET_ATTEMPT: 'Attempting to connect to WebSocket on FieldCommand.',
  DEVTOOLS_ATTEMPT: 'Attempting to connect to vendOS DevTools.',
  CONNECTED_DEVTOOLS: 'Connected to vendOS DevTools.',
  CONNECTED_WEBSOCKET: `Connected to WebSocket on FieldCommand V${FIELD_COMMAND_FLAG}`,
  WEBSOCKET_CLOSED: 'WebSocket on FieldCommand was closed.',
  DEVTOOLS_CONNECTION_FAILED: `Could not connect to vendOS DevTools. If you'd like to test vendOS JS, please use the vendOS Chrome DevTools ${DEVTOOLS_URL}, and make sure you click the vendOS DevTools browserAction button in the top-right of the Chrome toolbar in order to activate them for this tab.`,
  WEBSOCKET_CONNECTION_FAILED: 'Could not connect to WebSockets. Make sure you\'re running on a machine with access to FieldCommand.'

};

const NOOP = () => {};

/* eslint-disable no-console */

const logInfo = (msg) => {

  if (console && console.info)
    console.info(`%c${CONSOLE_PREFIX}: ${msg}`, CONSOLE_STYLES.INFO);

};

const logError = (msg) => {

  if (console && console.info)
    console.info(`%c${CONSOLE_PREFIX}: ${msg}`, CONSOLE_STYLES.ERROR);

};

class Socket extends EventEmitter {

  constructor () {

    super();

    this.connectionAttempts = 0;

  }

  send (data) {

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {

      this.socket.send(JSON.stringify(data));

    }
  }

  message (websocketMessage) {

    const {data: messageString} = websocketMessage;

    const message = JSON.parse(messageString || null);

    if (message) {

      const {id, requested, data} = message;

      if (typeof requested !== 'undefined' && !requested)
        this.emit('resourceEvent', message);
      else if (typeof id !== 'undefined')
        this.emit(`message.${id}`, data);

    }
  }

  open () {

    logInfo(MESSAGES.CONNECTED_WEBSOCKET);

    this.socket.onclose = this.close.bind();

    this.succeeded();

  }

  close () {

    logError(MESSAGES.WEBSOCKET_CLOSED);

    this.connectionAttempts = 0;
    this.connectToMachine();

  }

  connect ({websocketTestMode = false, websocketUrl = VENDOS_WEBSOCKET_URL, connectedCallback = NOOP}) {

    /* eslint-disable no-underscore-dangle */
    this.__websocketTestMode = websocketTestMode;
    this.__websocketUrl = websocketUrl;
    this.__connectedCallback = connectedCallback;
    /* eslint-enable no-underscore-dangle */

    if (!this.shouldConnectToDevTools()) {

      this.connectToMachine();

    } else {

      this.connectToDevtools();

    }
  }

  connectToMachine () {

    logInfo(MESSAGES.WEBSOCKET_ATTEMPT);

    /* eslint-disable-next-line no-underscore-dangle */
    this.socket = new WebSocket(this.__websocketUrl);
    this.socket.onclose = this.reconnectToMachine.bind(this);
    this.socket.onopen = this.open.bind(this);
    this.socket.onmessage = this.message.bind(this);

  }

  connectToDevtools () {

    logInfo(MESSAGES.DEVTOOLS_ATTEMPT);

    if (window[DEVTOOLS_FLAG]) {

      const devtools = window[DEVTOOLS_FLAG];

      const unlisten = devtools.listen(message => {

        if (message.id === 'handshake') {

          unlisten();

          this.socket = {

            readyState: WebSocket.OPEN,
            send: message => devtools.send(JSON.parse(message))

          };

          devtools.listen(message => this.message({
            data: JSON.stringify(message)
          }));

          logInfo(MESSAGES.CONNECTED_DEVTOOLS);

          this.succeeded();

        }
      });

      devtools.handshake();

    } else {

      setTimeout(this.reconnectToDevtools.bind(this), 500);

    }
  }

  reconnectToMachine () {

    this.connectionAttempts++;

    if (CONNECTION_ATTEMPT_LIMIT - this.connectionAttempts > 0) {

      setTimeout(this.connectToMachine.bind(this), CONNECTION_ATTEMPT_INTERVAL);

    } else {

      this.failed();

    }
  }

  reconnectToDevtools () {

    this.connectionAttempts++;

    if (CONNECTION_ATTEMPT_LIMIT - this.connectionAttempts > 0) {

      setTimeout(this.connectToDevtools.bind(this), CONNECTION_ATTEMPT_INTERVAL);

    } else {

      this.failed();

    }
  }

  failed () {

    if (!this.shouldConnectToDevTools()) {

      logError(MESSAGES.WEBSOCKET_CONNECTION_FAILED);

    } else {

      logError(MESSAGES.DEVTOOLS_CONNECTION_FAILED);

    }
  }

  succeeded () {

    /* eslint-disable-next-line no-underscore-dangle */
    if (this.__connectedCallback) {

      /* eslint-disable-next-line no-underscore-dangle */
      this.__connectedCallback();

    }
  }

  onResourceEvent (eventName, resourceName, fn) {

    this.on('resourceEvent', data => {

      const {resource, eventName: requestedEventName, data: eventData} = data;

      if (resource.toLowerCase() === resourceName.toLowerCase() && eventName === requestedEventName)
        fn(eventData);

    });
  }

  shouldConnectToDevTools () {

    /* eslint-disable-next-line no-underscore-dangle */
    return window.location.hostname !== MACHINE_HOSTNAME && !this.__websocketTestMode

  }
}

const instance = new Socket();

let id = 0;

class Base extends EventEmitter {

  async send (msg) {

    const currentId = id++;

    instance.send({
      id: currentId,
      ...msg,
    });

    return this.receive(currentId)

  }

  receive (id) {

    return new Promise((resolve, reject) => {

      instance.once(`message.${id}`, (res) => {

        if (res.ok)
          resolve(res);
        else
          reject(res);

      });
    })
  }
}

class Social extends Base {

  async send (msg) {

    return super.send({...msg, resource: 'social'})

  }
}

class Instagram extends Social {

  async send (msg) {

    return super.send({...msg, action: 'instagram'})

  }

  friendshipStatus (data) {

    return this.send({method: 'friendshipStatus', data})

  }
}

class Twitter extends Social {

  async send (msg) {

    return super.send({...msg, action: 'twitter'})

  }

  searchPosts (data) {

    return this.send({method: 'searchPosts', data})

  }
}

class Data extends Base {

  async send (msg) {

    return super.send({...msg, resource: 'data'})

  }
}

class Local extends Data {

  async send (msg) {

    return super.send({...msg, action: 'local'})

  }

  createSet (data) {

    return this.send({method: 'createSet', data})

  }

  deleteSet (data) {

    return this.send({method: 'deleteSet', data})

  }

  save (data) {

    return this.send({method: 'save', data})

  }

  get (data) {

    return this.send({method: 'get', data})

  }

  update (data) {

    return this.send({method: 'update', data})

  }

  delete (data) {

    return this.send({method: 'delete', data})

  }
}

class Machine extends Base {

  async send (msg) {

    return super.send({...msg, resource: 'machine'})

  }
}

class Vend extends Machine {

  async send (msg) {

    return super.send({...msg, action: 'vend'})

  }

  random (data) {

    return this.send({method: 'random', data})

  }

  channel (data) {

    return this.send({method: 'channel', data})

  }

  optimal (data) {

    return this.send({method: 'optimal', data})

  }

  product (data) {

    return this.send({method: 'product', data})

  }
}

class Channels extends Machine {

  async send (msg) {

    return super.send({...msg, action: 'channels'})

  }

  get () {

    return this.send({method: 'get'})

  }
}

class Products extends Machine {

  async send (msg) {

    return super.send({...msg, action: 'products'})

  }

  get () {

    return this.send({method: 'get'})

  }
}

class Payment extends Base {

  async send (msg) {

    return super.send({...msg, resource: 'payment'})

  }
}

class Charge extends Payment {

  async send (msg) {

    return super.send({...msg, action: 'charge'})

  }

  instant (data) {

    return this.send({method: 'instant', data})

  }

  hold (data) {

    return this.send({method: 'hold', data})

  }

  confirm (data) {

    return this.send({method: 'confirm', data})

  }

  cancel () {

    return this.send({method: 'cancel'})

  }
}

class Email extends Base {

  async send (msg) {

    return super.send({...msg, resource: 'email'})

  }
}

class Send extends Email {

  async send (msg) {

    return super.send({...msg, action: 'send'})

  }

  template (data) {

    return this.send({method: 'template', data})

  }
}

if (navigator.userAgent.indexOf('Chrome') === -1) {

  logError('It is highly recommended that you develop vendOS in Chrome v.77+.');

}

class VendOS {

  constructor ({websocketTestMode, websocketUrl, connectedCallback} = {}) {

    if (this.constructor.instance)
      return this.constructor.instance

    this.constructor.instance = this;

    instance.connect({websocketTestMode, websocketUrl, connectedCallback});

    this.Machine = {
      vend: new Vend(),
      channels: new Channels(),
      products: new Products(),
      on: (eventName, fn) => instance.onResourceEvent(eventName, 'machine', fn)
    };

    this.Social = {
      twitter: new Twitter(),
      instagram: new Instagram()
    };

    this.Data = {
      local: new Local()
    };

    this.Payment = {
      charge: new Charge()
    };

    this.Email = {
      send: new Send()
    };

    // This is for accessing (only protected by obscurity) any other possible
    // core method that exists. In the future (before releasing this version of
    // JS) we should ideally protect this route with auth of some sort.
    this.Throughput = new Base();

  }
}

export default VendOS;
