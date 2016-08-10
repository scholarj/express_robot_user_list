let mongoose = require('mongoose')

let dburi = 'mongodb://localhost:27017/robots'

mongoose.connect(dburi)

let conn = mongoose.connection
conn.on('error', console.error.bind(console, 'Mongo connection error:'))
conn.once('open', (cb) => {
  console.log('Mongo connection established.')
})

let userSchema = mongoose.Schema({
  userid: String,
  fname: String,
  lname: String,
  views: Number
})

exports.User = mongoose.model('User', userSchema)

if (process.argv[2] === 'test') {
  exports.User.find({}, (err, users) => {
    err ? console.error(err) : console.log(users)
  })
}
