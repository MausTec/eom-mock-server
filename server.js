const WebSocket = require('ws')
const Server = new WebSocket.Server({ port: 8080 })

console.log("Starting Edge-o-Matic Mock Server")

Server.on('connection', ws => {
  console.log("Remote connected.")

  ws.on('message', message => {
    console.log(`Got: ${message}`)
  })

  ws.send("OK")
})

process.on('SIGTERM', () => {
  Server.close(() => {
    process.exit(0)
  });
})