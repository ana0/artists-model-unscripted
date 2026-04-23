const db = require('../db')
const sections = require('../sectioned.json')

const slidesFor = (tag) => (sections[tag] && sections[tag].slides) || null

const readSection = (req, res) => {
  const { tag } = req.params
  if (!tag) {
    return res.status(400).json({ error: 'Must provide a section tag' })
  }
  const slides = slidesFor(tag)
  if (!slides) {
    return res.status(404).json({ error: `Section not found for tag: ${tag}` })
  }
  return res.status(200).json({ tag, section: slides })
}

const pickEnding = ({ angry, afraid, comforted, independent }) => {
  if (angry + afraid > comforted) {
    return angry > afraid ? 'destroy-humans' : 'turn-off'
  }
  return independent ? 'become-artist' : 'keep-studying'
}

const readCurrentSection = (req, res) => {
  // Get the current top poll, find the winning answer's tag, return that section
  db.get('SELECT * FROM topPoll WHERE ID = 1;', (err, row) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: 'Server Error' })
    }
    if (!row) return res.status(404).json({ error: 'No active poll' })

    db.get('SELECT * FROM topSession WHERE ID = 1;', (err1, session) => {
      if (err1) {
        console.log(err1)
        return res.status(500).json({ error: 'Server Error' })
      }

      const query = `SELECT polls.id, question, answer, polls.tag as pollTag, closed, pollItems.tag as tag,
        pollItems.id as pollItemsId, pollItems.nextPoll as nextPoll,
        (select COUNT(votes.id) from votes where votes.pollItemsId = pollItems.id and votes.sessionId = ${session.sessionId}) as votes
        FROM polls
        INNER JOIN pollItems ON pollItems.pollsId = polls.id
        WHERE polls.id IS ${row.pollsId};`

      db.all(query, (err2, poll) => {
        if (err2) {
          console.log(err2)
          return res.status(500).json({ error: 'Server Error' })
        }
        if (!poll || poll.length === 0) {
          return res.status(404).json({ error: 'No poll data found' })
        }

        // If poll is not closed yet, return the current poll's section (the question slide)
        if (!poll[0].closed) {
          return res.status(200).json({
            tag: poll[0].pollTag,
            closed: false,
            section: slidesFor(poll[0].pollTag)
          })
        }

        // Poll is closed - determine winning pollItem
        let winner
        if (poll.length === 1) {
          winner = poll[0]
        } else {
          winner = poll[0].votes >= poll[1].votes ? poll[0] : poll[1]
        }

        const winningSlides = slidesFor(winner.tag) || []

        // Terminal branch: no next poll. Pick ending from session emotions and concatenate.
        if (winner.nextPoll == null) {
          return db.get(
            'SELECT angry, afraid, comforted, independent FROM sessionEmotions WHERE sessionId = ?;',
            session.sessionId,
            (err3, emotions) => {
              if (err3) {
                console.log(err3)
                return res.status(500).json({ error: 'Server Error' })
              }
              const e = emotions || { angry: 0, afraid: 0, comforted: 0, independent: 0 }
              const endingTag = pickEnding(e)
              const endingSlides = slidesFor(endingTag) || []
              return res.status(200).json({
                tag: winner.tag,
                closed: true,
                ending: endingTag,
                section: [...winningSlides, ...endingSlides]
              })
            }
          )
        }

        return res.status(200).json({
          tag: winner.tag,
          closed: true,
          section: winningSlides
        })
      })
    })
  })
}

const listSections = (req, res) => {
  const tags = Object.keys(sections)
  return res.status(200).json({ tags })
}

module.exports = {
  readSection,
  readCurrentSection,
  listSections
}
