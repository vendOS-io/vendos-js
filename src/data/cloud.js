import Data from './index'

class Cloud extends Data {

  async send (data) {

    return this.send({action: 'local', ...data})

  }

  save (data) {

    return this.send({method: 'save', ...data})

  }
}

export default Cloud
