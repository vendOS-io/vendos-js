import Payment from './index'

class Charge extends Payment {

  async send (data) {

    return super.send({action: 'charge', ...data})

  }

  instant (data) {

    return this.send({method: 'instant', ...data})

  }

  hold (data) {

    return this.send({method: 'hold', ...data})

  }

  confirm (data) {

    return this.send({method: 'confirm', ...data})

  }

  cancel () {

    return this.send({method: 'cancel'})

  }
}

export default Charge
