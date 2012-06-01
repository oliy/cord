express = require('express')
#io = require('socket.io')
require('node-extjs')
require('./base')
log = console.log

port = 8000

app = express.createServer()
	
app.configure ->
	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));

app.configure 'development', ->
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

app.configure 'production', ->
	app.use(express.errorHandler());

app.get '/user/:name?', (req,res) ->
    res

app.listen(port);
log('Started server on port: '+port);

###
socket = io.listen(app).sockets;
socket.on('connection', function(client) {
    client.emit('bus', { type: 'chat.message', body:{ name: 'Pirate Server', text: 'Welcome to the Pirate server'} });
    client.on('bus', function(message) {
    });
    
    client.on('disconnect', function() { unregister(user); });
});
###