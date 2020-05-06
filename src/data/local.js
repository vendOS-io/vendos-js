import Data from './index'

class Local extends Data {

  async send (data) {

    return super.send({action: 'local', ...data})

  }

  createSet (data) {

    return this.send({method: 'createSet', ...data})

  }

  deleteSet (data) {

    return this.send({method: 'deleteSet', ...data})

  }

  save (data) {

    return this.send({method: 'save', ...data})

  }

  get (data) {

    return this.send({method: 'get', ...data})

  }

  update (data) {

    return this.send({method: 'update', ...data})

  }

  delete (data) {

    return this.send({method: 'delete', ...data})

  }
}

export default Local
