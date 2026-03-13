const WebSocket = require("ws")

const wss = new WebSocket.Server({ port: 8081 })

let queue = []

function broadcast(data){

const message = JSON.stringify(data)

wss.clients.forEach(client=>{
if(client.readyState === WebSocket.OPEN){
client.send(message)
}
})

}

setInterval(()=>{

if(queue.length === 0) return

broadcast({
type:"batch_pins",
pins:queue
})

queue = []

}, 60000) // release every minute


function queuePin(pin){

queue.push(pin)

}

module.exports = { queuePin }