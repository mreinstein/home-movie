'use strict'

const upsocket = require('upsocket')


const up = upsocket()

up.subscribe('message', function(data) {
  console.log('recvd message!:', data)
})

//up.connect('ws://192.168.42.74:8002')
up.connect('ws://127.0.0.1:8002')
