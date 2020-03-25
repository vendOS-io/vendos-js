import Machine from './machine'
import Instagram from './instagram'
import Twitter from './twitter'
import Data from './data'

if (navigator.userAgent.indexOf('Chrome') === -1) {

  console.error('It is highly recommended that you develop vendOS in Chrome v.77+.')

}

class VendOS {

  constructor () {

    this.Machine = new Machine()
    this.Instagram = new Instagram()
    this.Data = new Data()
    this.Twitter = new Twitter()

  }
}

export default VendOS
