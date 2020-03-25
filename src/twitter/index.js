import Base from '../base'

class Twitter extends Base {

  searchPosts (username, hashtag) {

    return this.send({type: 'twitter', action: 'searchPosts', username, hashtag})

  }
}

export default Twitter
