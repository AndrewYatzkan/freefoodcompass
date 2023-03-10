require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;

const { scrapeTweets } = require('./twitter');
const Tweet = require('./models/Tweet');

scrapeTweets();
setInterval(scrapeTweets, 20 * 60 * 1_000); // 20 mins


app.use(express.static(`${__dirname}/../public`));

// gets events that haven't ended
app.get('/events', async (req, res) => {
  let time = Date.now();
  // let time = 1670860900000;
  let events = await Tweet.find({end_timestamp: {$gt: time}});
  res.send(events);
});

app.listen(port, () => console.log(`listening on *:${port}`));
