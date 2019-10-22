import Base from '../base'


class Machine extends Base {

    constructor() {
        super()
    }

    async vend(action, data) {
        try {
            const response = await this.send({type: 'machine', action, ...data})
            
            if(response.ok) {
                return response
            } else {
                throw response
            }
        } catch (error) {
            throw error
        }
    }

    channels() {
        return this.send({type: 'machine', action:'channels'})
    }

    status() {
        return this.send({type: 'machine', action:'status'})
    }

    randomVend(data) {
        return this.vend('randomVend', data);
    }

    channelVend(data) {
        return this.vend('channelVend', data);
    }

    optimalVend(data) {
        return this.vend('optimalVend', data);
    }

}

export default Machine