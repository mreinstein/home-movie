'use strict'

const ChromecastAPI   = require('chromecast-api')
const WebSocketServer = require('ws').Server


function send(conn, message) {
  if(!conn || conn.readyState !== conn.OPEN) return

  conn.send(JSON.stringify(message), function(err) { })
}


const browser = new ChromecastAPI.Browser()

browser.on('deviceOn', function (device) {
  // can use this format to stream a video right from the internet
  //const urlMedia = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4'

  // streaming from the local media server
  const urlMedia = 'http://192.168.42.74:8000/the_last_picture_show_1971.mp4'

  device.play(urlMedia, 0, function() {
    console.log(`casting ${urlMedia}`)

    /*
    setTimeout(function () {
      //Pause the video
      device.pause(function () {
        console.log('Paused')
      })
    }, 20000)

    setTimeout(function () {
      //Stop video
      device.stop(function () {
        console.log('Stopped')
      })
    }, 30000)

    setTimeout(function () {
      //Close the streaming
      device.close(function () {
        console.log('Closed')
      })
    }, 40000)
    */
  })
})

const port = 8001
const server = new WebSocketServer({ port })

server.on('connection', function handleNewClient(client) {
  client.once('message', function(message, flags) {
    try {
      message = JSON.parse(message)
    } catch(er) {
      console.error('could not parse message as valid JSON. closing')
      client.close()
      return
    }

    console.log('new connection')
    //client.close()
  })
})

console.log(`casting service running at http://localhost:${port}`)
