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
    a.href = '#'
    a.innerText = videos[i]
    a.addEventListener('click', function(ev) {
      ev.preventDefault()
      console.log('playing', `http://media-server:8000/videos/${videos[i]}`)
      up.send(JSON.stringify(JSON.stringify({ type: 'PLAY', mediaUrl: `http://media-server:8000/videos/${videos[i]}` })))
    })

    let p = document.createElement('p')
    p.appendChild(a)
    document.body.appendChild(p)
  }
}

renderVideoList()
