/*
 * @license
 * vendOS v1.1.0
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

const DATA_TYPES = {

  MACHINE: 'machine',
  INSTAGRAM: 'instagram',
  DATA: 'data',
  TWITTER: 'twitter'

};

const FAKE_SOCKET_DELAY = 1000;

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

    this.socket;
    this.socketAttempts = 0;
    this.requestQueue = [];
    this.messageHandlers = [];

    this.connect();

  }

  send (data) {

    if (this.socket.readyState === WebSocket.OPEN) {

      this.socket.send(data);

    } else {

      this.requestQueue.push(data);

    }
  }

  message (message) {

    const data = JSON.parse(message.data || null);

    if (data) {

      const {type, id} = data;

      if (type == 'machine' && id == undefined)
        this.emit('machineEvent', data);
      else
        this.emit(`message.${data.id}`, data);

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

      this.openFakeSocket();

    }
  }

  connect () {

    logInfo('Attempting to connect to FieldCommand WebSocket');

    this.socket = new WebSocket(VENDOS_WEBSOCKET_URL);
    this.socket.onclose = this.reconnect.bind(this);
    this.socket.onopen = this.open.bind(this);
    this.socket.onmessage = this.message.bind(this);

  }

  flushQueue () {

    if (this.requestQueue.length) {

      let machineTypeSent;

      // As the hardware does not accept concurrent machine requests we need to
      // filter out the oldest requests of these types. The latest machine request
      // should be kept in the queue

      const queue = [].concat(this.requestQueue).reverse().filter(data => {

        const parsedData = JSON.parse(data);
        const isMachineType = parsedData.type && parsedData.type === DATA_TYPES.MACHINE;
        const removeRequest = machineTypeSent && isMachineType;

        if (isMachineType)
          machineTypeSent = true;

        return !removeRequest

      }).reverse();

      this.requestQueue = [];

      queue.forEach(this.send.bind(this));

    }
  }

  openFakeSocket () {

    logInfo('Cannot connect to socket; falling back to auto-responses');

    // At this point we want to fallback to auto responding with successful
    // responses. This will likely happen if they are developing locally and
    // have not installed the vendOS DevTools

    this.socket = {

      readyState: WebSocket.OPEN,
      send: data => {

        setTimeout(() => {

          const response = {data: JSON.stringify({...JSON.parse(data), ok: true})};

          this.message(response);

        }, FAKE_SOCKET_DELAY);
      }
    };

    this.flushQueue();

  }
}

const instance = new Socket();

let id = 0;


class Base extends EventEmitter {

  constructor () {

    super();

    instance.on('machineEvent', data => {

      this.emit(`message.${event.id}`, data);

    });
  }

  async send (data) {

    data.id = id++;

    instance.send(JSON.stringify(data));

    return await this.receive(data.id)

  }

  receive (id) {

    return new Promise(resolve => instance.once(`message.${id}`, resolve))

  }
}

class Machine extends Base {

  async vend (action, data) {

    const response = await this.send({type: 'machine', action, ...data});

    // TODO: Discuss this approach in-depth
    if(response.ok)
      return response
    else
      throw response

  }

  channels () {

    return this.send({type: 'machine', action: 'channels'})

  }

  status () {

    return this.send({type: 'machine', action: 'status'})

  }

  randomVend (data) {

    return this.vend('randomVend', data)

  }

  channelVend (data) {

    return this.vend('channelVend', data)

  }

  optimalVend (data) {

    return this.vend('optimalVend', data)

  }
}

class Instagram extends Base {

  friendshipStatus (username) {

    return this.send({type: 'instagram', action: 'friendshipStatus', username})

  }
}

class Twitter extends Base {

  searchPosts (username, hashtag) {

    return this.send({type: 'twitter', action: 'searchPosts', username, hashtag})

  }
}

class Data extends Base {

  save (data) {

    return this.send({type: 'data', action: 'set', save: data})

  }
}

if (navigator.userAgent.indexOf('Chrome') === -1) {

  console.error('It is highly recommended that you develop vendOS in Chrome v.77+.');

}

class VendOS {

  constructor () {

    this.Machine = new Machine();
    this.Instagram = new Instagram();
    this.Data = new Data();
    this.Twitter = new Twitter();

  }
}

module.exports = VendOS;
