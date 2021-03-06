import cors     from 'cors'
import express  from 'express'
import ls       from 'ls'
import register from 'register-multicast-dns'


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
