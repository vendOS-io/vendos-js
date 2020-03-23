/*
 * vendOS v1.0.4
 * (c) 2019 Social Vend Ltd. trading as vendOS 
 * Released under the MIT license
 * vendos.io
 */

import EventEmitter from 'wolfy87-eventemitter';

var Mock = {
    vend: {
        channelVend: {success: true},
        optimalVend: {success: true},
        randomVend: {success: true}
    }
};

// Grab all the actions and supply them the websocket connection

const emitter = new EventEmitter();

if(navigator.userAgent.indexOf("Chrome") == -1) {
    console.error("It is highly recommended that you develop vendOS in Chrome v.77+.");
}

// If socket does not connect then start sending timeout responses

const socket = new WebSocket('ws://fieldcommand:3000');
let developmentMode = false;

socket.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.type == 'machine' && data.id == undefined) {
        emitter.emit('machineEvent', data);
    } else {
        emitter.emit(`message.${data.id}`, data);
    }
};

socket.onerror = event => {
    developmentMode = true;
    console.log("%cPlease ignore the above WebSocket error - Its happening because you are running vendOS locally, no error will occur in production! \nAs vendOS is running in development mode, all promises resolve with a success after 5 seconds. \nHave fun making some cool apps! 🤙", "padding: 10px 0; color:#00c76b; font-size:15px");
};

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};


let id = 0;

class Base extends EventEmitter {

    constructor() {
        super();
        this.machineEvents();
    }

    machineEvents() {
        emitter.on('machineEvent', (event)=>{
            this.emit('event', event);
        });
    }

    async send(data) {        
        
        if(developmentMode) {
            id++;
            data.id = id;
            await sleep(5000);
            // find the correct response in the mocks.js file & sleep amount
            return Mock[data.type][data.action]
        } 
        
        if(socket.readyState === WebSocket.OPEN) {
            id++;
            data.id = id;
            socket.send(JSON.stringify(data));
            const response = await this.receive(data.id);
            return response
        } else {
            await sleep(500);
            return this.send(data)
        }
    }

    receive(id) {
        return new Promise(resolve => emitter.once(`message.${id}`, resolve));
    }

}

class Machine extends Base {

    constructor() {
        super();
    }

    async vend(action, data) {
        try {
            const response = await this.send({type: 'machine', action, ...data});
            
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

class Instagram extends Base {

    constructor() {
        super();
    }

    friendshipStatus(username) {
        return this.send({type: 'instagram', action:'friendshipStatus', username })
    }

}

class Twitter extends Base {

    constructor() {
        super();
    }

    searchPosts(username, hashtag) {
        return this.send({type: 'twitter', action:'searchPosts', username, hashtag })
    }

}

class Data extends Base {

    constructor() {
        super();
    }

    save(data) {
        return this.send({type: 'data', action:'set', save:data })
    }

}

class VendOS {

    constructor() {
      this.Machine = new Machine();
      this.Instagram = new Instagram();
      this.Data = new Data();
      this.Twitter = new Twitter();
    }


}

export default VendOS;
