import Base from '../base'

class Payment extends Base {

  async send (data) {

    return super.send({resource: 'payment', ...data})

  }
}

export default Payment
