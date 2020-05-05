import EventEmitter from 'wolfy87-eventemitter'
import {VENDOS_WEBSOCKET_URL, SOCKET_CONNECTION_INTERVAL, SOCKET_CONNECTION_ATTEMPTS, DEV_TOOLS_FLAG} from './helpers/constants'
import {logInfo, logError} from './helpers/logging'
import {immutablyRemoveKeysFromObject} from './helpers/misc'

class Socket extends EventEmitter {

  constructor () {

    super()

    this.socketAttempts = 0

  }

  send (data) {

    if (this.socket.readyState === WebSocket.OPEN) {

      this.socket.send(JSON.stringify(data))

    }
  }

  message (message) {

    const data = JSON.parse(message || null)

    if (data) {

      const {id} = data

      if (typeof id === 'undefined')
        this.emit('machineEvent', data)
      else
        this.emit(`message.${data.id}`, immutablyRemoveKeysFromObject(['id'], data))

    }
  }

  open () {

    this.socket.onclose = this.close.bind()
    this.flushQueue()

  }

  close () {

    logError('FieldCommand WebSocket closed')

    this.socketAttempts = 0
    this.reconnect()

  }

  reconnect () {

    this.socketAttempts++

    if (SOCKET_CONNECTION_ATTEMPTS - this.socketAttempts > 0) {

      setTimeout(() => this.connect(), SOCKET_CONNECTION_INTERVAL)

    } else {

      this.failed()

    }
  }

  connect () {

    if (window[DEV_TOOLS_FLAG]) {

      this.connectToDevtools()

    } else {

      this.connectToMachine()

    }
  }

  connectToMachine () {

    logInfo('Attempting to connect to FieldCommand WebSocket')

    this.socket = new WebSocket(VENDOS_WEBSOCKET_URL)
    this.socket.onclose = this.reconnect.bind(this)
    this.socket.onopen = this.open.bind(this)
    this.socket.onmessage = this.message.bind(this)

  }

  connectToDevtools () {

    logInfo('Connecting to vendOS DevTools')

    const devtools = window[DEV_TOOLS_FLAG]

    this.socket = {

      readyState: WebSocket.OPEN,
      send: (data) => devtools.send(JSON.parse(data))

    }

    devtools.listen((message) => this.message(JSON.stringify(message)))

  }

  failed () {

    logInfo('Could not connect to a Machine websocket. If you\'d like to test vendOS JS, please use the vendOS Chrome Dev Tools.')

  }
}

const instance = new Socket()

export default instance
