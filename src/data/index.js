import Base from '../base'

class Data extends Base {

  save (data) {

    return this.send({type: 'data', action: 'set', save: data})

  }
}

export default Data
