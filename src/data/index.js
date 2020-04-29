import Base from '../base'

class Data extends Base {

  async send (data) {

    return super.send({resource: 'data', ...data})

  }
}

export default Data
