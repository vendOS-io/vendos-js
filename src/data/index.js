import Base from '../base'


class Data extends Base {

    constructor() {
        super()
    }

    save(data) {
        return this.send({type: 'data', action:'set', save:data })
    }

}

export default Data