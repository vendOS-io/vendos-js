import Base from '../base'

class Data extends Base {

  save (data) {

    return super.send({resource: 'data', ...data})

  }
}

export default Data
