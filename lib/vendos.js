/*
 * @license
 * vendOS v0.0.1
 * (c) 2020 Social Vend Ltd. trading as vendOS
 * Released under the MIT license
 * vendos.io
 */

'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var EventEmitter = _interopDefault(require('wolfy87-eventemitter'));

const VENDOS_WEBSOCKET_URL = 'ws://fieldcommand:3000';

const CONSOLE_STYLES = {
  INFO: 'background: #021019; color: #03FFCF; padding: 5px 10px; border-radius: 2px',
  ERROR: 'background: #021019; color: #D44242; padding: 5px 10px; border-radius: 2px',
};

const CONSOLE_PREFIX = 'VendOS SDK';

const SOCKET_CONNECTION_INTERVAL = 100;
const SOCKET_CONNECTION_ATTEMPTS = 5;

const DEV_TOOLS_FLAG = '__VENDOS_DEVTOOLS_EXTENSION__';

/* eslint-disable no-console */

const logInfo = (msg) => {

  if (console && console.info)
    console.info(`%c${CONSOLE_PREFIX}: ${msg}`, CONSOLE_STYLES.INFO);

};

const logError = (msg) => {

  if (console && console.info)
    console.info(`%c${CONSOLE_PREFIX}: ${msg}`, CONSOLE_STYLES.ERROR);

};

function immutablyRemoveKeysFromObject (keys, state) {

  return Object.keys(state).filter((key) => !keys.includes(key)).reduce((acc, key) => ({

    ...acc,
    [key]: state[key]

  }), {})
}

class Socket extends EventEmitter {

  constructor () {

    super();

    this.socketAttempts = 0;

  }

  send (data) {

    if (this.socket.readyState === WebSocket.OPEN) {

      this.socket.send(JSON.stringify(data));

    }
  }

  message (message) {

    const data = JSON.parse(message || null);

    if (data) {

      const {id} = data;

      if (typeof id === 'undefined')
        this.emit('machineEvent', data);
      else
        this.emit(`message.${data.id}`, immutablyRemoveKeysFromObject(['id'], data));

    }
  }

  open () {

    this.socket.onclose = this.close.bind();
    this.flushQueue();

  }

  close () {

    logError('FieldCommand WebSocket closed');

    this.socketAttempts = 0;
    this.reconnect();

  }

  reconnect () {

    this.socketAttempts++;

    if (SOCKET_CONNECTION_ATTEMPTS - this.socketAttempts > 0) {

      setTimeout(() => this.connect(), SOCKET_CONNECTION_INTERVAL);

    } else {

      this.failed();

    }
  }

  connect () {

    if (window[DEV_TOOLS_FLAG]) {

      this.connectToDevtools();

    } else {

      this.connectToMachine();

    }
  }

  connectToMachine () {

    logInfo('Attempting to connect to FieldCommand WebSocket');

    this.socket = new WebSocket(VENDOS_WEBSOCKET_URL);
    this.socket.onclose = this.reconnect.bind(this);
    this.socket.onopen = this.open.bind(this);
    this.socket.onmessage = this.message.bind(this);

  }

  connectToDevtools () {

    logInfo('Connecting to vendOS DevTools');

    const devtools = window[DEV_TOOLS_FLAG];

    this.socket = {

      readyState: WebSocket.OPEN,
      send: (data) => devtools.send(JSON.parse(data))

    };

    devtools.listen((message) => this.message(JSON.stringify(message)));

  }

  failed () {

    logInfo('Could not connect to a Machine websocket. If you\'d like to test vendOS JS, please use the vendOS Chrome Dev Tools.');

  }
}

const instance = new Socket();

let id = 0;

class Base extends EventEmitter {

  async send (data) {

    const currentId = id++;

    instance.send({
      ...data,
      id: currentId
    });

    return this.receive(currentId)

  }

  receive (id) {

    return new Promise((resolve) => instance.once(`message.${id}`, resolve))

  }
}

class Social extends Base {

  async send (...data) {

    return super.send({resource: 'social', ...data})

  }
}

class Instagram extends Social {

  async send (...data) {

    return super.send({action: 'instagram', ...data})

  }

  friendshipStatus ({username}) {

    return this.send({method: 'friendshipStatus', ...{username}})

  }
}

class Twitter extends Social {

  async send (...data) {

    return super.send({action: 'twitter', ...data})

  }

  searchPosts ({username, hashtag}) {

    return this.send({method: 'searchPosts', ...{username, hashtag}})

  }
}

class Data extends Base {

  async send (data) {

    return super.send({resource: 'data', ...data})

  }
}

class Local extends Data {

  async send (data) {

    return super.send({action: 'local', ...data})

  }

  createSet (data) {

    return this.send({method: 'createSet', ...data})

  }

  deleteSet (data) {

    return this.send({method: 'deleteSet', ...data})

  }

  save (data) {

    return this.send({method: 'save', ...data})

  }

  update (data) {

    return this.send({method: 'update', ...data})

  }

  delete (data) {

    return this.send({method: 'delete', ...data})

  }
}

class Machine extends Base {

  async send (data) {

    return super.send({resource: 'machine', ...data})

  }
}

class Vend extends Machine {

  async send (data) {

    return super.send({action: 'vend', ...data})

  }

  random (data) {

    return this.send({method: 'random', ...data})

  }

  channel (data) {

    return this.send({method: 'channel', ...data})

  }

  optimal (data) {

    return this.send({method: 'optimal', ...data})

  }
}

class Channels extends Machine {

  async send (data) {

    return super.send({action: 'channels', ...data})

  }

  get () {

    return this.send({method: 'get'})

  }
}

class Payment extends Base {

  async send (data) {

    return super.send({resource: 'payment', ...data})

  }
}

class Charge extends Payment {

  async send (data) {

    return super.send({action: 'charge', ...data})

  }

  instant (data) {

    return this.send({method: 'instant', ...data})

  }

  withConfirmation (data) {

    return this.send({method: 'withConfirmation', ...data})

  }

  confirm (data) {

    return this.send({method: 'confirm', ...data})

  }

  cancel () {

    return this.send({method: 'cancel'})

  }
}

if (navigator.userAgent.indexOf('Chrome') === -1) {

  console.error('It is highly recommended that you develop vendOS in Chrome v.77+.');

}

class VendOS {

  constructor () {


    console.log('starting');

    //Socket.connect()

    this.Machine = {
      vend: new Vend(),
      channels: new Channels()
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
  }
}

module.exports = VendOS;
