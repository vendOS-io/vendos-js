import Machine from './index'

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

export default Vend
