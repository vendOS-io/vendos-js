import Social from './index'

class Twitter extends Social {

  async send (...data) {

    return this.super({action: 'twitter', ...data})

  }

  searchPosts ({username, hashtag}) {

    return this.send({method: 'searchPosts', ...{username, hashtag}})

  }
}

export default Twitter
