const db = require('../db')
const sections = require('../sectioned.json')

const readSection = (req, res) => {
  const { tag } = req.params
  if (!tag) {
    return res.status(400).json({ error: 'Must provide a section tag' })
  }
  const section = sections[tag]
  if (!section) {
    return res.status(404).json({ error: `Section not found for tag: ${tag}` })
  }
  return res.status(200).json({ tag, section })
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

      const query = `SELECT polls.id, question, answer, polls.tag as pollTag, closed, pollItems.tag as tag, pollItems.id as pollItemsId,
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
          const pollSection = sections[poll[0].pollTag]
          return res.status(200).json({
            tag: poll[0].pollTag,
            closed: false,
            section: pollSection || null
          })
        }

        // Poll is closed - determine winning tag
        let winningTag
        if (poll.length === 1) {
          winningTag = poll[0].tag
        } else {
          winningTag = poll[0].votes >= poll[1].votes ? poll[0].tag : poll[1].tag
        }

        const section = sections[winningTag]
        return res.status(200).json({
          tag: winningTag,
          closed: true,
          section: section || null
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
