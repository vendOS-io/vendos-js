import EventEmitter from 'wolfy87-eventemitter'
import {VENDOS_WEBSOCKET_URL, SOCKET_CONNECTION_INTERVAL, SOCKET_CONNECTION_ATTEMPTS, DATA_TYPES, DEV_TOOLS_FLAG} from './helpers/constants'
import {logInfo, logError} from './helpers/logging'

class Socket extends EventEmitter {

  constructor () {

    super()

    this.socket
    this.socketAttempts = 0
    this.requestQueue = []
    this.messageHandlers = []

    if (window[DEV_TOOLS_FLAG]) {

      this.connectToDevtools()

    } else {

      this.connect()

    }
  }

  send (data) {

    if (this.socket.readyState === WebSocket.OPEN) {

      this.socket.send(JSON.stringify(data))

    } else {

      this.requestQueue.push(data)

    }
  }

  message (message) {

    const data = JSON.parse(message.data || null)

    if (data) {

      const {type, id} = data

      if (type == 'machine' || typeof id == 'undefined')
        this.emit('machineEvent', data)
      else
        this.emit(`message.${data.id}`, data)

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
      send: data => devtools.send(JSON.parse(data))

    }
  }

  flushQueue () {

    if (this.requestQueue.length) {

      let machineTypeSent

      // As the hardware does not accept concurrent machine requests we need to
      // filter out the oldest requests of these types. The latest machine request
      // should be kept in the queue

      const queue = [].concat(this.requestQueue).reverse().filter(data => {

        const isMachineType = data.type && data.type === DATA_TYPES.MACHINE
        const removeRequest = machineTypeSent && isMachineType

        if (isMachineType)
          machineTypeSent = true

        return !removeRequest

      }).reverse()

      this.requestQueue = []

      queue.forEach(this.send.bind(this))

    }
  }

  failed () {

    logInfo('Could not connect to a Machine websocket. If you\'d like to test vendOS JS, please use the vendOS Chrome Dev Tools.')

    this.flushQueue()

  }
}

const instance = new Socket()

export default instance
