'use strict'

const upsocket = require('upsocket')


const up = upsocket()

up.subscribe('message', function(data) {
  console.log('recvd message!:', data)
})

up.connect('ws://media-server:8002')


async function getVideoList() {
  const reponse = await fetch('/videos')
  const result = await response.json()
  console.log('result:', result)
  return result
}

getVideoList()
