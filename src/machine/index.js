import Base from '../base'

class Machine extends Base {

  async vend (action, data) {

    const response = await this.send({type: 'machine', action, ...data})

    // TODO: Discuss this approach in-depth
    if(response.ok)
      return response
    else
      throw response

  }

  channels () {

    return this.send({type: 'machine', action: 'channels'})

  }

  status () {

    return this.send({type: 'machine', action: 'status'})

  }

  randomVend (data) {

    return this.vend('randomVend', data)

  }

  channelVend (data) {

    return this.vend('channelVend', data)

  }

  optimalVend (data) {

    return this.vend('optimalVend', data)

  }
}

export default Machine
