// module to parse and geocode tweets from the Twitter Stream
//
// records counts in Redis and streams results to the Browser
// with Socket.io to visualize on a map of the US with D3.


// setup modules
var twitter = require('twit'),
	states = require('./us_states'),
	 redis = require('redis');

var States = new states();

// connect to the Redis server
var client = redis.createClient();

// initialize Twitter API with my credentials
var twit = new twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.API_KEY,
  access_token_secret: process.env.API_SECRET
});


// Bounding box for the continental US
var united_states = ['-123.5','26.2','-66.2','48.2'];

var socket_broadcast = function socket_broadcast(loc, party) {
		// Socket.io here
		client.publish("tweet_channel", loc + ":" + party);
		console.log("published to " + loc + ":" + party);	
};

// function to count thye total Tweets matching our criteria
// as well as which side (Obama or Romney) is being mentioned. 
var incrementCount = function incrementCount(location, topic) {
	if(location == null){
	 	return null;
  	}
  
  	console.log("tweets came in for " + location);
  	//increment atomically total tweet count
  	client.incr("total");
  
	//increment individuals tweet count
	if(topic) {
		// Obama is topic == true
		client.incr(location + ":OBAMA");
		socket_broadcast(location, "OBAMA");
	} else {
		// Romney is topic == false
		client.incr(location + ":ROMNEY");
		socket_broadcast(location, "ROMNEY");
	}
  }


// function to filter the text fo the tweet to check for topic
var filterElection = function filterElection(text, state) {
	// check to see if Obama is mentioned in the text of the tweet
	if(/barack/i.test(text) || /obama/i.test(text) ){
		incrementCount(state, true);
	}
	
	// Check to see if Romney is mentioned in the text of the tweet
	if( /mitt/i.test(text) || /romney/i.test(text) ) {
		incrementCount(state, false);	
	}
}


// function to parse a tweet directly from the Twitter Stream
// and verify that it is from the US, extract the state, and 
// pass this information to filter for the content of the text.
var parseTweet = function parseTweet(tweet) {

	// check to make sure the tweet came from within the US
	if(tweet == null || tweet.place.country_code != 'US') {
		return null;
	} 
	
	var type = tweet.place.place_type;
 	var place = tweet.place.full_name.split(',');
 	var state = null;

	// if a city is given, find state from the body of the tweet
	switch(type) {
		case "city":
			state = place[1].trim();
			break;
	// if a state is given, convert it into an abbreviation
		case "admin": 
			state = states.abbreviate(place[0].trim());
			break;
		default:
			state = null;
			break;
	}
	
  filterElection(tweet.text, state);
}


// asynchonously read from Twitter stream filtering for tweets from the US
var stream = twit.stream('statuses/filter', { locations : united_states });
stream.on('tweet', parseTweet);


// catch any uncaught Exceptions so they do not crash the loop
process.on('uncaughtException', function(err) {
  console.log(err);
});
