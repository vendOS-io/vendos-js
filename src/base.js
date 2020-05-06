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

    return new Promise((resolve, reject) => {

      Socket.once(`message.${id}`, (res) => {

        if (res.ok)
          resolve(res)
        else
          reject(res)

      })
    })
  }
}

export default Base
