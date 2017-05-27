'use strict'

const lookup   = require('lookup-multicast-dns')
const upsocket = require('upsocket')


const up = upsocket()

up.subscribe('message', function(data) {
  console.log('recvd message!:', data)
})

lookup('movies-cast.local', function (err, ip) {
  console.log(ip) // is resolved using multicast-dns (192.168.10.254 on my machine)
  up.connect(`ws://${ip}:8002`)
})

async function getVideoList() {
  const response = await fetch('/videos')
  return response.json()
}

async function renderVideoList() {
  const videos = await getVideoList()
  for(let i=0; i < videos.length; i++) {
    const a = document.createElement('a')
    a.href = '#'
    a.innerText = videos[i]
    a.addEventListener('click', function(ev) {
      ev.preventDefault()
      const mediaUrl = `http://movies.local:8000/videos/${videos[i]}`
      console.log('playing', mediaUrl)
      up.send(JSON.stringify({ type: 'PLAY', mediaUrl }))
    })

    const p = document.createElement('p')
    p.appendChild(a)
    document.body.appendChild(p)
  }
}

renderVideoList()
