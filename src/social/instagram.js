import Social from './index'

class Instagram extends Social {

  friendshipStatus ({username}) {

    return this.send({method: 'friendshipStatus', ...{username}})

  }
}

export default Instagram
