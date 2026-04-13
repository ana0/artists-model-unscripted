const bodyParser = require('body-parser')
const polls = require('./controllers/polls')
const sessions = require('./controllers/sessions')
const votes = require('./controllers/votes')

module.exports = (app) => {
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  app.get('/workshop', (req, res) => res.status(200).json('Server listening'))

  app.get('/workshop/polls', polls.readPolls)
  app.get('/workshop/polls/:top', polls.readPolls)
  app.post('/workshop/polls', polls.createPoll)
  app.put('/workshop/polls', polls.updatePoll)
  app.delete('/workshop/polls', polls.deletePoll)

  app.get('/workshop/sessions', sessions.readSessions)
  app.get('/workshop/sessions/:top', sessions.readSessions)
  app.post('/workshop/sessions', sessions.createSession)
  app.put('/workshop/sessions', sessions.updateSession)

  app.get('/workshop/votes', (req, res) => res.status(200).json('Votes endpoint'))
  app.get('/workshop/votes/:id', votes.readVotes)
  app.post('/workshop/votes', votes.createVotes)
  app.put('/workshop/votes', (req, res) => res.status(200).json('Votes endpoint'))
  app.delete('/workshop/votes', (req, res) => res.status(200).json('Votes endpoint'))
}