// Grab all the actions and supply them the websocket connection
import EventEmitter from 'wolfy87-eventemitter'
import Mock from './mocks'

const emitter = new EventEmitter();

if (navigator.userAgent.indexOf("Chrome") == -1){
    console.error("It is highly recommended that you develop vendOS in Chrome v.77+.")
}

// If socket does not connect then start sending timeout responses

const socket = new WebSocket('ws://fieldcommand:3000')
let developmentMode = false

socket.onmessage = event => {
    const data = JSON.parse(event.data)
    if (data.type == 'machine' && data.id == undefined) {
        emitter.emit('machineEvent', data)
    } else {
        emitter.emit(`message.${data.id}`, data);
    }
};

socket.onerror = event => {
    developmentMode = true
    console.log("%cPlease ignore the above WebSocket error - Its happening because you are running vendOS locally, no error will occur in production! \nAs vendOS is running in development mode, all promises resolve with a success after 5 seconds. \nHave fun making some cool apps! 🤙", "padding: 10px 0; color:#00c76b; font-size:15px")
    console.log(developmentMode);
};

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}


let id = 0;

class Base extends EventEmitter {

    constructor() {
        super()
        this.machineEvents()
    }

    machineEvents() {
        emitter.on('machineEvent', (event)=>{
            this.emit('event', event)
        })
    }

    async send(data) {        
        
        if(developmentMode) {
            id++
            data.id = id
            await sleep(5000)
            // find the correct response in the mocks.js file & sleep amount
            return Mock[data.type][data.action]
        } 
        
        if(socket.readyState === WebSocket.OPEN) {
            id++
            data.id = id
            socket.send(JSON.stringify(data))
            const response = await this.receive(data.id)
            return response
        } else {
            await sleep(500)
            return this.send(data)
        }
    }

    receive(id) {
        return new Promise(resolve => emitter.once(`message.${id}`, resolve));
    }

}
  
export default Base;