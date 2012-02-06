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

app.get('/session', function(req, res){
	console.log(req.session);
	res.send(req.session);
});

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
				res.end(mydata.substr(9));
			});
		});
	}
	else res.redirect("/dailymile_login");
});


// rebecca11245
// jschaps1

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
				res.render('index.jade', {data: JSON.parse(mydata.substring(9))});
			});
		});

	}
	else if (!req.session.auth) res.redirect("/dailymile_login");
	else res.send("Invalid username!");
});

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
			console.log(mydata);
			res.send(mydata);
		});
	});
	post_req.write(decodeURIComponent(req.body.data));
	post_req.end();
});

// Request an OAuth Request Token, and redirects the user to authorize it
app.get('/dailymile_login', function(req, res) {
	res.redirect("https://api.dailymile.com/oauth/authorize?"+querystring.stringify(auth_options));
});

app.get('/dailymile_import', function(req, res) {
	var token_options = {
		client_secret: "Unep5RDXzewyp0PsCZXqfTYrXGTGM8tdnt9trHE7",
		client_id: client_id,
		redirect_uri : 'http://localhost:3000/dailymile_import',
		grant_type: "authorization_code",
		code: req.query.code
	};
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
	post_req.write("");
	post_req.end();

});
app.listen(3000);
console.log("listening on http://localhost:3000");
