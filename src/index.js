import Instagram from './social/instagram'
import Twitter from './social/twitter'
import Local from './data/local'
import Vend from './machine/vend'
import Channels from './machine/channels'

if (navigator.userAgent.indexOf('Chrome') === -1) {

  console.error('It is highly recommended that you develop vendOS in Chrome v.77+.')

}

class VendOS {

  constructor () {

    this.Machine = {
      vend: new Vend(),
      channels: new Channels()
    }

    this.Social = {
      twitter: new Twitter(),
      instagram: new Instagram()
    }

    this.Data = {
      local: new Local()
    }
  }
}

export default VendOS
