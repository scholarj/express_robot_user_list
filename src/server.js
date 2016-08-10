'use strict'
let express = require('express')
let morgan = require('morgan')
let path = require('path')
let serverStatic = require('serve-static')
let serveIndex = require('serve-index')
let fs = require('fs')
let mongo = require('mongodb').MongoClient

let hostname = '0.0.0.0'  // Dont use localhost.
let port = parseInt(process.env.PORT || 80)
let production = (process.env.NODE_ENV === 'production')
let staticDir = path.join(__dirname, '../static')
let dataFile = path.join(__dirname, '../data.json')
let tmplDir = path.join(__dirname, '../views')
let dburi = 'mongodb://localhost:27017/robots'

let data = []
let app = express()
app.use(morgan('combined'))  // Generates access log to stdout.

// Template engine support.
app.set('views', tmplDir)
app.set('view engine', 'pug')

// Helper functions.
let verify_user = (req, res, next) => {
  let userid = req.params.userid.replace('.json', '')
  let found = false
  data.forEach((rec) => {
    if (rec.userid === userid) found = true
  })
  found ? next() : res.redirect(`/error/${userid}`)
}

let loadUsersFromDB = (uri) => {
  mongo.connect(uri, (err, db) => {
    if (err) console.err(err)
    let cursor = db.collection('users').find()  // find all.
    cursor.each((err, doc) => {
      if (err) {
        console.err(err)
      } else {
        if (doc) {
          data.push(doc)
        } else {
          db.close()
          console.log(`Loaded ${data.length} user records from ${dburi}.\n`)
        }
      }
    })
  })
}
loadUsersFromDB(dburi)

// Homepage.
app.get('/', function (req, res) {
  let html = `
    <h1>Welcome to Robot World!</h1>
    Check out our <a href='/user'>user list</a>
  `
  res.header('Content-Type', 'text/html').send(html).end()
})

// List all users with links to their profiles.
app.get('/user', (req, res) => {
  res.render('user', {users: data})
})

// User profiles.
app.get('/user/:userid', verify_user, (req, res) => {
  let is_json = req.params.userid.match(/\.json$/)
  let userid = req.params.userid.replace('.json', '')
  data.forEach((rec) => {
    if (rec.userid === userid) {
      rec.views += 1
      is_json ? res.json(rec)
              : res.render('user_profile', {obj: rec})
    }
  })
})

// Invalid userid page.
app.get('/error/:userid', (req, res) => {
  let html = `<h2>OOPS, userid ${req.params.userid} does not exist!</h2>`
  res.header('Content-Type', 'text/html').status(404).send(html).end()
})

// Middleware handles loading static files mapped to /static in the URLs.
app.use('/static', serverStatic(staticDir))

// Middleware handles directory browsing on /static and below.
app.use('/static', serveIndex(staticDir, {view: 'details', icons: true}))

// Handling errors.
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500)
  production ? res.send('500 Something broke!') : res.send(`<pre>${err.stack}</pre>`)
  res.end()
})

app.listen(port, hostname, function () {
  console.log(`Running server at http://${hostname}:${port}`)
  console.log(`Production mode ${production}.`)
  console.log(`Serving static files from ${staticDir}\n`)
})
