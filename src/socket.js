import EventEmitter from 'wolfy87-eventemitter'
import {VENDOS_WEBSOCKET_URL, CONNECTION_ATTEMPT_INTERVAL, CONNECTION_ATTEMPT_LIMIT, DEVTOOLS_FLAG, FIELD_COMMAND_FLAG, MESSAGES} from './helpers/constants'
import {logInfo, logError} from './helpers/logging'
import {immutablyRemoveKeysFromObject, getEnvironmentVariable} from './helpers/misc'

class Socket extends EventEmitter {

  constructor () {

    super()

    this.connectionAttempts = 0

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

    logInfo(MESSAGES.CONNECTED_WEBSOCKET)

    this.socket.onclose = this.close.bind()

  }

  close () {

    logError(MESSAGES.WEBSOCKET_CLOSED)

    this.connectionAttempts = 0
    this.connectToMachine()

  }

  connect () {

    if (getEnvironmentVariable(FIELD_COMMAND_FLAG)) {

      this.connectToMachine()

    } else {

      this.connectToDevtools()

    }
  }

  connectToMachine () {

    logInfo(MESSAGES.WEBSOCKET_ATTEMPT)

    this.socket = new WebSocket(VENDOS_WEBSOCKET_URL)
    this.socket.onclose = this.reconnectToMachine.bind(this)
    this.socket.onopen = this.open.bind(this)
    this.socket.onmessage = this.message.bind(this)

  }

  connectToDevtools () {

    logInfo(MESSAGES.DEVTOOLS_ATTEMPT)

    if (window[DEVTOOLS_FLAG]) {

      const devtools = window[DEVTOOLS_FLAG]

      this.socket = {

        readyState: WebSocket.OPEN,
        send: (data) => devtools.send(JSON.parse(data))

      }

      devtools.listen((message) => this.message(JSON.stringify(message)))

      devtools.handshake()

      logInfo(MESSAGES.CONNECTED_DEVTOOLS)

    } else {

      setTimeout(this.reconnectToDevtools.bind(this), 500)

    }
  }

  reconnectToMachine () {

    this.connectionAttempts++

    if (CONNECTION_ATTEMPT_LIMIT - this.connectionAttempts > 0) {

      setTimeout(this.connectToMachine.bind(this), CONNECTION_ATTEMPT_INTERVAL)

    } else {

      this.failed()

    }
  }

  reconnectToDevtools () {

    this.connectionAttempts++

    if (CONNECTION_ATTEMPT_LIMIT - this.connectionAttempts > 0) {

      setTimeout(this.connectToDevtools.bind(this), CONNECTION_ATTEMPT_INTERVAL)

    } else {

      this.failed()

    }
  }

  failed () {

    if (getEnvironmentVariable(FIELD_COMMAND_FLAG)) {

      logError(MESSAGES.WEBSOCKET_CONNECTION_FAILED)

    } else {

      logError(MESSAGES.DEVTOOLS_CONNECTION_FAILED)

    }
  }
}

const instance = new Socket()

export default instance
