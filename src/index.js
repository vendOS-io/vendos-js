import Machine from './machine/index.js'
import Instagram from './instagram/index.js'
import Twitter from './twitter/index.js'
import Data from './data/index.js'

class VendOS {

    constructor() {
      this.Machine = new Machine()
      this.Instagram = new Instagram()
      this.Data = new Data()
      this.Twitter = new Twitter()
    }


}
  
export default VendOS;