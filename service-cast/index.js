'use strict'

const ChromecastAPI   = require('chromecast-api')
const WebSocketServer = require('ws').Server
const register        = require('register-multicast-dns')


function send(conn, message) {
  if(!conn || conn.readyState !== conn.OPEN) return

  conn.send(JSON.stringify(message), function(err) { })
}


function castDeviceDiscovered(device) {
  console.log('discovered chromecast device:', device)
  castDevice = device
}


let castDevice

const browser = new ChromecastAPI.Browser()
browser.on('deviceOn', castDeviceDiscovered)

const port = 8002
const server = new WebSocketServer({ perMessageDeflate: true, port })

server.on('connection', function handleNewClient(client) {
  client.once('message', function(message) {
    try {
      message = JSON.parse(message)
    } catch(er) {
      console.error('could not parse message as valid JSON. closing')
      client.close()
      return
    }

    // no cast device found or ready, ignore follow up commands
    if (!castDevice) return

    if(message.type === 'PLAY') {
      const secondsElapsed = message.secondsElapsed || 0

      // can use this format to stream a video right from the internet
      // http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4
      // streaming from the local media server
      // http://192.168.42.74:8000/videos/the_last_picture_show_1971.mp4
      castDevice.play(message.mediaUrl, secondsElapsed, function() {
        console.log(`casting ${message.mediaUrl}`)
      })
    } else if (message.type === 'PAUSE') {
      castDevice.pause(function() {
        console.log('paused')
      })
    } else if (message.type === 'STOP') {
      castDevice.stop(function() {
        console.log('stopped')
      })
    } else if (message.type === 'CLOSE') {
      castDevice.close(function() {
        console.log('closed')
      })
    }
    console.log('new connection')

    //client.close()
  })

  //client.send(JSON.stringify({ type: 'INTRO' }))
})

console.log('registering movie-cast.local')
register('movies-cast')
console.log(`casting service running at ws://movies-cast.local:${port}`)
