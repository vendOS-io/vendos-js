import Social from './index'

class Instagram extends Social {

  async send (...data) {

    return super.send({action: 'instagram', ...data})

  }

  friendshipStatus ({username}) {

    return this.send({method: 'friendshipStatus', ...{username}})

  }
}

export default Instagram
