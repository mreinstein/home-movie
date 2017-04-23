'use strict'

const express = require('express')
const ls      = require('ls')
//const serve   = require('serve')


/*
const videoServer = serve('/home/pi/media', {
  port: 8000
})
*/

const app = express()

app.use(express.static('public'))

app.get('/videos', function(req, res) {
  const allFiles = ls('/home/pi/media/*')
  const fileNames = []
  for (let file of allFiles) {
    fileNames.push(file.file)
    //console.log(file.name, 'is', file.stat.size);
  }

  res.json(fileNames)
})

app.use('/videos', express.static('/home/pi/media'))

const port = 8000
app.listen(port)

console.log(`video service running at http://localhost:${port}`)
