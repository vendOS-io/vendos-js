import Payment from './index'

class Charge extends Payment {

  async send (data) {

    return super.send({action: 'charge', ...data})

  }

  instant (data) {

    return this.send({method: 'instant', ...data})

  }

  withConfirmation (data) {

    return this.send({method: 'withConfirmation', ...data})

  }

  confirm (data) {

    return this.send({method: 'confirm', ...data})

  }

  cancel () {

    return this.send({method: 'cancel'})

  }
}

export default Charge
