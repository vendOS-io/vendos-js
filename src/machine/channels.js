import Machine from './index'

class Channels extends Machine {

  async send (data) {

    return super.send({action: 'channels', ...data})

  }

  get () {

    return this.send({method: 'get'})

  }
}

export default Channels
