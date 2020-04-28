import EventEmitter from 'wolfy87-eventemitter'
import Socket from './socket.js'

let id = 0

class Base extends EventEmitter {

  constructor () {

    super()

    // Socket.on('machineEvent', data => {
    //
    //   this.emit(`message.${event.id}`, data)
    //
    // })
  }

  async send (data) {

    data.id = id++

    Socket.send(data)

    return await this.receive(data.id)

  }

  receive (id) {

    return new Promise(resolve => Socket.once(`message.${id}`, resolve))

  }
}

export default Base
