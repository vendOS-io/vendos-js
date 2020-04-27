import Base from '../base'

class Data extends Base {

  save (data) {

    return this.send({resource: 'data', ...data})

  }
}

export default Data
