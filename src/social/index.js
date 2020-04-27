import Base from '../base'

class Social extends Base {

  async send (...data) {

    return this.super({resource: 'social', ...data})

  }
}

export default Social
