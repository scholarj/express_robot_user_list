'use strict'
let express = require('express')
let morgan = require('morgan')
let path = require('path')
let serverStatic = require('serve-static')
let serveIndex = require('serve-index')
let DBUser = require('./db').User

let hostname = '0.0.0.0'  // Dont use localhost.
let port = parseInt(process.env.PORT || 80)
let production = (process.env.NODE_ENV === 'production')
let staticDir = path.join(__dirname, '../static')
let tmplDir = path.join(__dirname, '../views')

let app = express()
app.use(morgan('combined'))  // Generates access log to stdout.

// Template engine support.
app.set('views', tmplDir)
app.set('view engine', 'pug')

// Helper functions.
let verifyUser = (req, res, next) => {
  let userid = req.params.userid.replace('.json', '')
  DBUser.findOne({userid: userid}, (err, user) => {
    if (err) {
      console.error(err)
    } else if (user) {
      next()
    } else {
      res.redirect(`/error/${userid}`)
    }
  })
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
  DBUser.find({}, (err, users) => {
    err ? console.log(err) : res.render('user', {users: users})
  })
})

// User profiles.
app.get('/user/:userid', verifyUser, (req, res) => {
  let isJSON = req.params.userid.match(/\.json$/)
  let userid = req.params.userid.replace('.json', '')
  DBUser.findOne({userid: userid}, (err, user) => {
    if (err) {
      console.error(err)
    } else {
      user.views += 1
      DBUser.findOneAndUpdate({userid: userid}, {views: user.views}, (err, doc) => {
        if (err) console.error(err)
      })
      isJSON ? res.json(user)
             : res.render('user_profile', {obj: user})
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
