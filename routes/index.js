
/*
 * GET home page.
 */
redis = require('redis'),
    states = require("../lib/us_states");
    // connect to the Redis server
    var client = redis.createClient();
    
var States = new states();
  
exports.index = function(req, res){
    

    debugger;
    // read in tweet counts
    
    var tweets = {};
    
    for(var name in States.states_hash){
        var abbrev = States.states_hash[name];
        var obama_key = abbrev + ":OBAMA";
        var romney_key = abbrev + ":ROMNEY";

       client.get(obama_key, (function() {
           var key = obama_key;
           return function(err, reply) {
                tweets[key] = reply;     
            };
        })());

        client.get(romney_key, (function() {
                   var key = romney_key;
                   return function(err, reply) {
                        tweets[key] = reply;     
                    };
        })());
    }
    debugger;
    client.get("total", function(err, reply) {
        tweets["total"] = reply;
    });
    
    client.on("idle", function(err) {
        res.render('index', { title: 'TweetMap', tweet_count : tweets  });
    });
};