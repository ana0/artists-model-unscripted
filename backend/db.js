const sqlite3 = require('sqlite3').verbose();
const script = require('./v2/script.json');
const sections = require('./v2/sectioned.json');


const db = new sqlite3.Database('./quiz.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to sqlite database.');
});

db.serialize(async () => {
  db.run("CREATE TABLE IF NOT EXISTS scripts (id INTEGER PRIMARY KEY ASC, name TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS polls (id INTEGER PRIMARY KEY ASC, question TEXT, tag TEXT, closed BOOLEAN DEFAULT 0)");
  db.run("CREATE TABLE IF NOT EXISTS pollItems (id INTEGER PRIMARY KEY ASC, answer TEXT, pollsId INT, nextPoll INT, tag TEXT, " +
    "angry INT DEFAULT 0, afraid INT DEFAULT 0, comforted INT DEFAULT 0, independent INT DEFAULT 0, " +
    "FOREIGN KEY(pollsId) REFERENCES polls(id))");
  // Idempotent migration for DBs created before emotion columns existed
  ['angry', 'afraid', 'comforted', 'independent'].forEach(col => {
    db.run(`ALTER TABLE pollItems ADD COLUMN ${col} INT DEFAULT 0`, (err) => {
      if (err && !/duplicate column/i.test(err.message)) console.error(err.message);
    });
  });
  db.run("CREATE TABLE IF NOT EXISTS topPoll (id INTEGER PRIMARY KEY ASC, pollsId INT, FOREIGN KEY(pollsId) REFERENCES polls(id))");
  db.run("CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY ASC, name TEXT, pollsId INT, FOREIGN KEY(pollsId) REFERENCES polls(id))");
  db.run("CREATE TABLE IF NOT EXISTS topSession (id INTEGER PRIMARY KEY ASC, sessionId INT, FOREIGN KEY(sessionId) REFERENCES sessions(id))");
  db.run("CREATE TABLE IF NOT EXISTS sessionEmotions (sessionId INTEGER PRIMARY KEY, angry INT DEFAULT 0, afraid INT DEFAULT 0, " +
    "comforted INT DEFAULT 0, independent INT DEFAULT 0, FOREIGN KEY(sessionId) REFERENCES sessions(id))");
  db.run("CREATE TABLE IF NOT EXISTS votes " +
    "(id INTEGER PRIMARY KEY ASC, pollsId INT, pollItemsId INT, sessionId INT, voterId INT," +
    "FOREIGN KEY(pollsId) REFERENCES polls(id), FOREIGN KEY(pollItemsId) REFERENCES pollItems(id), FOREIGN KEY(sessionId) REFERENCES sessions(id))");


  db.get(`SELECT * FROM scripts WHERE name = ?;`, [script.name], async (err, alreadyparsed) => {
    console.log("after", alreadyparsed)
    if (!alreadyparsed) {
      let currentPassage = script.startnode;
      let answers = [];
      console.log(currentPassage);

      // Function to insert a poll and return the pollId
      const insertPoll = (question, tag) => {
        return new Promise((resolve, reject) => {
          db.run("INSERT INTO polls(question, tag) VALUES (?, ?)", [question, tag], function (err) {
            if (err) {
              return reject(err);
            }
            resolve(this.lastID);
          });
        });
      };

      // Insert polls
      for (let i = 0; i < script.passages.length; i++) {
        let passage = script.passages[i];
        if (passage.props && passage.props.question && passage.tags[0] !== 'gift-shop') {
          try {
            let pollId = await insertPoll(passage.props.question, passage.tags[0]);
            passage.links.forEach((l) => {
              answers.push({ answer: l.name, pollsId: pollId, nextPassage: l.pid });
            });
            console.log("poll", passage.props.question, passage.tags[0]);
          } catch (err) {
            console.error(err.message);
          }
        }
      }

      console.log(answers);

      // Function to get the next poll ID
      const getNextPollId = (tag) => {
        return new Promise((resolve, reject) => {
          db.get("SELECT id FROM polls WHERE tag = ?", [tag], (err, row) => {
            if (err) {
              return reject(err);
            }
            resolve(row ? row.id : null);
          });
        });
      };

      // Function to insert a poll item with emotion values from its destination section
      const insertAnswer = (answer, pollId, nextPoll, tag) => {
        const e = (sections[tag] && sections[tag].emotions) || {};
        const angry = e.angry || 0;
        const afraid = e.afraid || 0;
        const comforted = e.comforted || 0;
        const independent = e.independent || 0;
        return new Promise((resolve, reject) => {
          db.run(
            "INSERT INTO pollItems(answer, pollsId, nextPoll, tag, angry, afraid, comforted, independent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [answer, pollId, nextPoll, tag, angry, afraid, comforted, independent],
            function (err) {
              if (err) return reject(err);
              resolve(this.lastID);
            }
          );
        });
      };

      // Insert poll items
      for (let i = 0; i < answers.length; i++) {
        answers[i].tag = script.passages.find(p => p.pid === answers[i].nextPassage).tags[0];
        while (script.passages.find(p => p.pid === answers[i].nextPassage).links && script.passages.find(p => p.pid === answers[i].nextPassage).links.length === 1) {
          answers[i].nextPassage = script.passages.find(p => p.pid === answers[i].nextPassage).links[0].pid;
        }
        try {
          let nextPoll = await getNextPollId(script.passages.find(p => p.pid === answers[i].nextPassage).tags[0]);
          await insertAnswer(answers[i].answer, answers[i].pollsId, nextPoll, answers[i].tag);
          console.log("answer", answers[i].answer, answers[i].pollsId, nextPoll, answers[i].tag);

        } catch (err) {
            console.error(err.message);
        }
      }

      db.run("INSERT INTO scripts(name) VALUES (?)", script.name);    //db.run("INSERT INTO scripts(name) VALUES (?)", script.name);
    }

    // Sync pollItems emotion columns from sectioned.json on every startup so
    // edits to section emotions are picked up without requiring a db rebuild
    for (const [tag, data] of Object.entries(sections)) {
      const e = (data && data.emotions) || {};
      db.run(
        "UPDATE pollItems SET angry = ?, afraid = ?, comforted = ?, independent = ? WHERE tag = ?",
        [e.angry || 0, e.afraid || 0, e.comforted || 0, e.independent || 0, tag]
      );
    }
  });

});

module.exports = db