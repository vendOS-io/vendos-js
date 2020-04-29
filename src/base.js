import EventEmitter from 'wolfy87-eventemitter'
import Socket from './socket'

let id = 0

class Base extends EventEmitter {

  async send (data) {

    const currentId = id++

    Socket.send({
      ...data,
      id: currentId
    })

    return this.receive(currentId)

  }

  receive (id) {

    return new Promise((resolve) => Socket.once(`message.${id}`, resolve))

  }
}

export default Base
