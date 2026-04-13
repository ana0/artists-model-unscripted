const db = require('../db')

const readVotes = (req, res) => {
  // fairly sure this was never used??

  // console.log('read votes')
  // if (!req.params.id) return res.status(403).json({ error: 'Must send poll id'})
  // const pollId = req.params.id;
  // db.all(`SELECT votes.id, voteWeight, pollItemsId, answer FROM votes INNER JOIN pollItems ON pollItems.id = votes.pollItemsId WHERE votes.pollsId IS ${pollId};`, function(err, votes) {
  //   if (err) {
  //     console.log(err);
  //     return res.status(500).json({ error: 'Server Error' });
  //   }
  //   console.log(votes)
  //   const seenAnswers = {}
  //   const summedVotes = votes.map((vote, index, array) => {
  //   	if (seenAnswers[vote.pollItemsId]) {
  //       const match = array.find(a => a.pollItemsId === vote.pollItemsId)
  //       console.log(match)
  //       match.voteWeight += vote.voteWeight
  //       return false;
  //   	}
  //   	else { seenAnswers[vote.pollItemsId] = true; return vote }
  //   })
  //   console.log(summedVotes)
  //   // sort summedVotes by voteWeight
  //   return res.status(200).json({ totals: summedVotes })
  // })
}

const createVotes = (req, res) => {
  console.log('create votes')
  //let pollId
  console.log(req.body)
  let { pollItemsId, sessionId, pollId, voterId } = req.body
  // must use old function notation
  return db.get(`SELECT rowid AS id FROM votes WHERE sessionId == '${sessionId}' AND pollsId == '${pollId}' AND voterId == '${voterId}'`, function(err, hasVoted) {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: 'Server Error' });
    }
    console.log(hasVoted)
    if (hasVoted) return res.status(403).json({ error: 'You have already voted on this poll' });
    db.run("INSERT INTO votes(pollsId, pollItemsId, sessionId, voterId) VALUES (?, ?, ?, ?)", [pollId, pollItemsId, sessionId, voterId]);
    //db.run("INSERT INTO hasVoted(sessionId, pollsId) VALUES (?, ?)", [sessionId, pollId])
    return res.status(200).json(`Create votes for session ${sessionId} on poll ${pollId} for voter ${voterId}`);
  })
}

const updateVotes = () => {
	
}

const deleteVotes = () => {
	
}

module.exports = {
  readVotes,
  createVotes,
  updateVotes,
  deleteVotes
}