'use strict'

const upsocket = require('upsocket')


const up = upsocket()

up.subscribe('message', function(data) {
  console.log('recvd message!:', data)
})

up.connect('ws://media-server:8002')


async function getVideoList() {
  const response = await fetch('/videos')
  const result = await response.json()
  console.log('result:', result)
  return result
}

async function renderVideoList() {
  const videos = await getVideoList()
  for(let i=0; i < videos.length; i++) {
    let a = document.createElement('a')
    a.innerText = videos[i]
    a.addEventListener('click', function(ev) {
      ev.preventDefault()
      console.log('TODO: play::', videos[i])
    })
    document.body.appendChild(a)
  }
}

renderVideoList()
