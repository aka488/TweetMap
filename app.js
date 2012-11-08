
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , redis = require("redis")
  , sio = require("socket.io");
  
  
  client = redis.createClient();
  

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set("view options", { layout: false });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.listen(3000);
var io = sio.listen(app);
console.log("Express server listening on port %d in %s mode", 3000, app.settings.env);

// broadcast changes in Redis
io.sockets.on('connection', function(socket) {
  console.log("A User Connected!");
});

client.subscribe("tweet_channel"); 
client.on("message", function(channel, message) {
  console.log("redis emitted " + message);
  io.sockets.emit("location", message);
});
