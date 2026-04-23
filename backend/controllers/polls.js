const e = require('cors')
const db = require('../db')

const readPolls = (req, res)  => {
  if (req.params.top) {
    //console.log("calling get top poll")
    return db.get(`SELECT * FROM topPoll WHERE ID = 1;`, async (err1, row) => {
      if (err1) {
        console.log(err1)
        return res.status(500).json({ error: 'Server Error' });
      }
      if (!row) return res.status(401).json({ error: 'Not found' });
      //console.log(row.pollsId)
      return db.get(`SELECT * FROM topSession WHERE ID = 1;`, async (err1, session) => {
        if (err1) {
          console.log(err1)
          return res.status(500).json({ error: 'Server Error' });
        }
        // get all answers for this poll, as well as the number of votes for each answer
        //console.log(session)
        const query = `SELECT polls.id, question, answer, polls.tag as pollTag, closed, pollItems.tag as tag, pollItems.id as pollItemsId, pollItems.nextPoll as nextPoll,
        (select COUNT(votes.id) from votes where votes.pollItemsId = pollItems.id and votes.sessionId = ${session.sessionId}) as votes,
        (select tag from polls where polls.id = nextPoll) as nextTag
        FROM polls 
        INNER JOIN pollItems ON pollItems.pollsId = polls.id 
        WHERE polls.id IS ${row.pollsId};`

        

        return db.all(query, async (err, poll) => {
          if (err) {
            console.log(err)
            return res.status(500).json({ error: 'Server Error' });
          }
          console.log(poll)
          db.get("SELECT * FROM pollItems", async (err, polls) => {
            console.log(polls)

            return db.get("select * from votes;", async (err, votes) => {
              //console.log(votes)
              if (!poll) return res.status(401).json({ error: 'Not found' });
              return res.status(200).json({ poll, session })
            })
          })

        })
      })
    })
  }
  // return all polls
  return db.all(`SELECT id, question FROM polls;`, async (err, polls) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Server Error' });
    }
    console.log(polls)
    if (!polls) return res.status(401).json({ error: 'No polls' });
    console.log("returning")
    return res.status(200).json({ polls })
  })
}

const createPoll = (req, res) => {
  let pollId
  const { question, answers } = req.body
  // create poll and all its answers
  db.run("INSERT INTO polls(question) VALUES (?)", question, function(err) {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: 'Server Error' });
    }
    console.log(`inserted question ${this.lastID}`)
    pollId = this.lastID
    const stmt = db.prepare("INSERT INTO pollItems(answer, pollsId, nextPoll, tag) VALUES (?, ?, ?, ?)");
    answers.map((a) => {
      return stmt.run([a.answer, pollId, a.nextPoll, a.tag]);
    })
    stmt.finalize();
    res.status(200).json(`Created poll ${pollId}`)
  })
}

const updatePoll = (req, res)  => {
  // get current top poll, find winning answer, open next top poll
  db.get(`SELECT * FROM topPoll WHERE ID = 1;`, async (err, row) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: 'Server Error' });
    }
    if (!row) return res.status(401).json({ error: 'Not found' });
    return db.get(`SELECT * FROM topSession WHERE ID = 1;`, async (err1, session) => {
      if (err1) {
        console.log(err1)
        return res.status(500).json({ error: 'Server Error' });
      }
      // get all answers for this poll, as well as the number of votes for each answer
      const query = `SELECT polls.id, question, answer, closed, pollItems.id as pollItemsId, pollItems.nextPoll as nextPoll,
      pollItems.angry as angry, pollItems.afraid as afraid, pollItems.comforted as comforted, pollItems.independent as independent,
      (select COUNT(votes.id) from votes where votes.pollItemsId = pollItems.id and votes.sessionId = ${session.sessionId}) as votes
      FROM polls
      INNER JOIN pollItems ON pollItems.pollsId = polls.id
      WHERE polls.id IS ${row.pollsId};`

      return db.all(query, async (err, poll) => {
        if (err) {
          console.log(err)
          return res.status(500).json({ error: 'Server Error' });
        }
        console.log("poll", poll)
        if (!poll) return res.status(401).json({ error: 'Not found' });
        // to-do: handle tie
        let winningAnswer = poll[0].votes > poll[1].votes ? poll[0] : poll[1];

        // Increment session emotions by the winning answer's values
        const incrementEmotions = () => new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO sessionEmotions(sessionId, angry, afraid, comforted, independent)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(sessionId) DO UPDATE SET
               angry = angry + excluded.angry,
               afraid = afraid + excluded.afraid,
               comforted = comforted + excluded.comforted,
               independent = independent + excluded.independent;`,
            [session.sessionId, winningAnswer.angry, winningAnswer.afraid, winningAnswer.comforted, winningAnswer.independent],
            (err) => err ? reject(err) : resolve()
          )
        })

        try {
          await incrementEmotions()
        } catch (err) {
          console.log(err)
          return res.status(500).json({ error: 'Server Error' });
        }

        // If the winner leads nowhere (chain ends at gift-shop), leave topPoll pointing
        // at the current closed poll. readCurrentSection resolves the ending from emotions.
        if (winningAnswer.nextPoll == null) {
          console.log(`poll ended at terminal branch; topPoll left at ${row.pollsId}`)
          return res.status(200).json(`Update poll (terminal)`)
        }

        db.run("INSERT OR REPLACE INTO topPoll (ID, pollsId) VALUES (1, ?);", winningAnswer.nextPoll, function(err) {
          if (err) {
            console.log(err)
            return res.status(500).json({ error: 'Server Error' });
          }
          console.log(`updated top poll to ${winningAnswer.nextPoll}`)
          res.status(200).json(`Update poll ${winningAnswer.nextPoll}`)
        })
      })
    })
  })
}

const deletePoll = (req, res)  => {
  // close current top poll
  db.get(`SELECT * FROM topPoll WHERE ID = 1;`, async (err, row) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: 'Server Error' });
    }
    return db.run("UPDATE polls SET closed = 1 WHERE id = ?;", row.pollsId, function(err) {
      if (err) {
        console.log(err)
        return res.status(500).json({ error: 'Server Error' });
      }
      return res.status(200).json(`Close poll`)
    })
  })
}

module.exports = {
  readPolls,
  createPoll,
  updatePoll,
  deletePoll
}