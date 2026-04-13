const express = require('express')
const routes = require('./routes')
const db = require('./db')
const cors = require('cors')

const app = express()

const frontend =  new URL("https://sonar-workshop.netlify.app");

// app.use(
//   cors({
//     origin: [
//       frontend.hostname,
//       new RegExp(`.${frontend.hostname}`, "i"),
//     ],
//     allowedHeaders: [
//       "Authorization",
//       "Content-Length",
//       "Content-Type",
//       "Origin",
//     ],
//     methods: ["GET", "PUT", "POST", "DELETE"],
//     credentials: true,
//   })
// );

//app.use(cors({ origin: true }))
app.use(cors())
routes(app)


const port = process.env.PORT || 8040


const server = app.listen(port, async err => {
  if (err) console.error(err)
  else console.log(`Server up on ${port}`)
})

process.on('SIGINT', () => {
    db.close();
    server.close();
    console.log('closed db and server')
});

module.exports = app
module.exports.server = server