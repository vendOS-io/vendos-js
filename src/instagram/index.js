import Base from '../base'


class Instagram extends Base {

  friendshipStatus (username) {

    return this.send({type: 'instagram', action: 'friendshipStatus', username})

  }
}

export default Instagram
