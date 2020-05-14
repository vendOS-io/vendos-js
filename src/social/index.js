import Base from '../base'

class Social extends Base {

  async send (...data) {

    return super.send({resource: 'social', ...data})

  }
}

export default Social
