'use strict'
let express = require('express')
let morgan = require('morgan')
let path = require('path')
let serverStatic = require('serve-static')
let serveIndex = require('serve-index')
let fs = require('fs')

let hostname = '0.0.0.0'  // Dont use localhost.
let port = parseInt(process.env.PORT || 80)
let production = (process.env.NODE_ENV === 'production')
let staticDir = path.join(__dirname, '../static')
let dataFile = path.join(__dirname, '../data.json')
let tmplDir = path.join(__dirname, '../views')

let data = JSON.parse(fs.readFileSync(dataFile, 'utf8'))

let app = express()
app.use(morgan('combined'))  // Generates access log to stdout.

// Template engine support.
app.set('views', tmplDir)
app.set('view engine', 'pug')

// Helper functions.
let verify_user = (req, res, next) => {
  let userid = req.params.userid.replace('.json', '')
  let rec = data.users[userid]
  rec ? next() : res.redirect(`/error/${userid}`)
}

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
  res.render('user', {users: data.users})
})

// User profiles.
app.get('/user/:userid', verify_user, (req, res) => {
  let is_json = req.params.userid.match(/\.json$/)
  let userid = req.params.userid.replace('.json', '')
  let rec = data.users[userid]
  rec.views += 1
  is_json ? res.json(rec)
          : res.render('user_profile', {rec: rec, userid: userid})
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
