'use strict'

const cors     = require('cors')
const express  = require('express')
const ls       = require('ls')
const register = require('register-multicast-dns')


const app = express()

app.use(cors())

app.use(express.static('public'))

app.get('/videos', function(req, res) {
  const allFiles = ls('/home/pi/media/*')
  const fileNames = []
  for (let file of allFiles) {
    fileNames.push(file.file)
  }

  res.json(fileNames)
})

app.use('/videos', express.static('/home/pi/media'))

const port = 8000
app.listen(port)

console.log('registering movies.local')
register('movies')

console.log(`video service running at http://movies.local:${port}`)
