import EventEmitter from 'wolfy87-eventemitter'
import {VENDOS_WEBSOCKET_URL, SOCKET_CONNECTION_INTERVAL, SOCKET_CONNECTION_ATTEMPTS, DATA_TYPES, FAKE_SOCKET_DELAY} from './helpers/constants'
import {logInfo, logError} from './helpers/logging'

class Socket extends EventEmitter {

  constructor () {

    super()

    this.socket
    this.socketAttempts = 0
    this.requestQueue = []
    this.messageHandlers = []

    this.connect()

  }

  send (data) {

    if (this.socket.readyState === WebSocket.OPEN) {

      this.socket.send(data)

    } else {

      this.requestQueue.push(data)

    }
  }

  message (message) {

    const data = JSON.parse(message.data || null)

    if (data) {

      const {type, id} = data

      if (type == 'machine' && id == undefined)
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

      this.openFakeSocket()

    }
  }

  connect () {

    logInfo('Attempting to connect to FieldCommand WebSocket')

    this.socket = new WebSocket(VENDOS_WEBSOCKET_URL)
    this.socket.onclose = this.reconnect.bind(this)
    this.socket.onopen = this.open.bind(this)
    this.socket.onmessage = this.message.bind(this)

  }

  flushQueue () {

    if (this.requestQueue.length) {

      let machineTypeSent

      // As the hardware does not accept concurrent machine requests we need to
      // filter out the oldest requests of these types. The latest machine request
      // should be kept in the queue

      const queue = [].concat(this.requestQueue).reverse().filter(data => {

        const parsedData = JSON.parse(data)
        const isMachineType = parsedData.type && parsedData.type === DATA_TYPES.MACHINE
        const removeRequest = machineTypeSent && isMachineType

        if (isMachineType)
          machineTypeSent = true

        return !removeRequest

      }).reverse()

      this.requestQueue = []

      queue.forEach(this.send.bind(this))

    }
  }

  openFakeSocket () {

    logInfo('Cannot connect to socket; falling back to auto-responses')

    // At this point we want to fallback to auto responding with successful
    // responses. This will likely happen if they are developing locally and
    // have not installed the vendOS DevTools

    this.socket = {

      readyState: WebSocket.OPEN,
      send: data => {

        setTimeout(() => {

          const response = {data: JSON.stringify({...JSON.parse(data), ok: true})}

          this.message(response)

        }, FAKE_SOCKET_DELAY)
      }
    }

    this.flushQueue()

  }
}

const instance = new Socket()

export default instance
