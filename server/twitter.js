require('dotenv').config();

const { processTweet } = require('./gpt');
const { TwitterApi } = require('twitter-api-v2');
const Tweet = require('./models/Tweet');

const twitterClient = new TwitterApi({
	appKey: process.env.CONSUMER_KEY,
	appSecret: process.env.CONSUMER_SECRET,
	accessToken: process.env.ACCESS_TOKEN,
	accessSecret: process.env.ACCESS_TOKEN_SECRET
});

const readOnlyClient = twitterClient.readOnly;

async function alreadyScraped({id}) {
	return !!(await Tweet.findOne({id}));
}

function toTimestamp(str) {
	return new Date(`${str} CST`).getTime();
}

async function saveTweet(tweet) {
	let info = await processTweet(tweet);
	if (info.error) {
		console.log(`Couldn\'t save tweet: ${tweet.text}`, info.error);
		await Tweet.create({id: tweet.id});
		return;
	}

	info.start_timestamp = toTimestamp(info.time_begin);
	info.end_timestamp = toTimestamp(info.time_end);
	info.location = info.full_location;
	delete info.time_begin;
	delete info.time_end;
	delete info.street_address;
	delete info.full_location;

	await Tweet.create(info);
}

async function scrapeTweets(max=10) {
	console.log('Scraping tweets');
	let tweets = [];

	let timeline = {
		done: false,
		fetchNext: async () =>
			timeline = await readOnlyClient.v2.userTimeline(process.env.TWITTER_ACCOUNT_ID, { exclude: ['replies', 'retweets'], 'tweet.fields': ['created_at'] })
	};

	let n = 0;
	while (!timeline.done) {
		await timeline.fetchNext();
		for (const tweet of timeline) {
			if (n++ >= max) break;
			if (await alreadyScraped(tweet)) {
				console.log('Finished scraping');
				return;
			}
			await saveTweet(tweet);
		}
		if (n >= max) break;
	}

	console.log('Finished scraping');
}

module.exports = { scrapeTweets };