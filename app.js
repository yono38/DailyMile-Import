var express = require('express'),
	 https = require('https'),
	 querystring = require('querystring');

// Setup the Express.js server
var app = express.createServer();
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
	secret: "daily_mile_secret_code"
}));

app.set('view options', {
  layout: false
});

// Config stuff
// Please don't use my API key for public stuff!
var client_id = "uZ6bjTo4H7U3Bi5hEKcEQWUbACrWeOVTPDXA4QnY",
	auth_options = {
		'response_type': 'code',
		'client_id': client_id,
		'redirect_uri' : 'http://localhost:3000/dailymile_import'
	};

// Home Page
app.get('/', function(req, res){
	if(!req.session.oauth_access_token) {
		res.redirect("/dailymile_login");
	}
	else {
		res.redirect("/dailymile_import");
	}
});

// for debugging purposes
app.get('/session', function(req, res){
	console.log(req.session);
	res.send(req.session);
});

// for import page javascript
app.get('/client.js', function(req, res){
	res.sendfile('client.js');
});

app.get('/me', function(req, res){
	if (req.session.auth){
		var me_opts = {
			'host' : 'api.dailymile.com',
			'path' : '/people/me.json?oauth_token='+req.session.auth.access_token
		}
		https.get(me_opts, function(me_res){
			var mydata;
			me_res.on('data', function (chunk) {
			  mydata += chunk;
			});
			me_res.on('end', function(){
				res.render('search.jade', {data: JSON.parse(mydata.substr(9))});
			});
		});
	}
	else res.redirect("/dailymile_login");
});

// makes a list of first 20 entries from that user
// I might build in pagination later if I anyone asks
app.get('/entries/:username', function(req, res){
	if (req.session.auth && req.params.username){
		var me_opts = {
			'host' : 'api.dailymile.com',
			'path' : '/people/'+req.params.username+'/entries.json?oauth_token='+req.session.auth.access_token
		}
		https.get(me_opts, function(me_res){
			var mydata;
			me_res.on('data', function (chunk) {
			  mydata += chunk;
			});
			me_res.on('end', function(){
				if (me_res.statusCode == 404) res.send("Invalid username! <a href='/me'>Try Again</a>");
				else res.render('index.jade', {data: JSON.parse(mydata.substring(9))});
			});
		});

	}
	else if (!req.session.auth) res.redirect("/dailymile_login");
	else res.send("Invalid username! <a href='/me'>Try Again</a>");
});

// internal API to post authenticated entries to dailymile API
app.post('/add_entry', function(req, res){
	var options = {
		host : 'api.dailymile.com',
		port: 443,		
		method : 'POST',
		path : '/entries.json?oauth_token='+req.session.auth.access_token,
		headers: {
			'content-length' : decodeURIComponent(req.body.data).length
		}
	};
	var mydata = '';
	var post_req = https.request(options, function(post_res) {
		console.log('STATUS: ' + post_res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(post_res.headers));
		post_res.setEncoding('utf8');
		post_res.on('data', function (chunk) {
		  mydata += chunk;
		});
		post_res.on('end', function(){
//			console.log(mydata);
			res.send(mydata);
		});
	});
	// Because there is no universally agreed-upon specification for param strings, it is not possible to encode complex data structures using this method in a manner that works ideally across all languages supporting such input.
	// See http://api.jquery.com/jQuery.param/
	post_req.write(decodeURIComponent(req.body.data));
	post_req.end();
});

// Request an OAuth Request Token, and redirects the user to authorize it
app.get('/dailymile_login', function(req, res) {
	res.redirect("https://api.dailymile.com/oauth/authorize?"+querystring.stringify(auth_options));
});

// Should probably be called dailymile_auth
// Authenticates the user with dailymile and gets a token
app.get('/dailymile_import', function(req, res) {
	var token_options = {
		client_secret: "Unep5RDXzewyp0PsCZXqfTYrXGTGM8tdnt9trHE7",
		client_id: client_id,
		redirect_uri : 'http://localhost:3000/dailymile_import',
		grant_type: "authorization_code",
		code: req.query.code
	};
	// gotta send a content-length header even though you aren't sending any data
	// kinda weird, but I get it
	var post_opts = {
		host:  'api.dailymile.com',
		port: 443,
		path: '/oauth/token?'+querystring.stringify(token_options),
		method: 'POST',
		headers: {
			'content-length': 0
		}
	};
	console.log(post_opts.host+post_opts.path);
	var mydata = '';
	var post_req = https.request(post_opts, function(post_res) {
		console.log('STATUS: ' + post_res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(post_res.headers));
		post_res.setEncoding('utf8');
		post_res.on('data', function (chunk) {
		  mydata += chunk;
		});
		post_res.on('end', function(){
				req.session.auth = JSON.parse(mydata);
				console.log('Auth Token Received: '+mydata);
				res.redirect("/me");
		});
	});
	// you need to write something, even empty, to send the POST
	post_req.write("");
	post_req.end();

});
app.listen(3000);
console.log("listening on http://localhost:3000");
