'use strict';

var express = require('express');
var app = express();
var https = require('https');
var http = require('http');
var fs = require('fs');

app.use(express.static(__dirname + '/public'));

app.get('/*', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

var portHttp = process.env.PORT || 3000;
http.createServer(app).listen(portHttp, function (err, res) {
    if (err) {
        console.log('Failed to start HTTP server on port' + portHttp, err);
        return;
    }
    console.log('HTTP server listening on port ' + portHttp);
});


if (app.get('env') === 'development') {
    var portHttps = process.env.PORT_SSL || 3001;
    var options = {
        key: fs.readFileSync('./config/certs/dev.citizenos.com.key'),
        cert: fs.readFileSync('./config/certs/dev.citizenos.com.crt')
    };

    https.createServer(options, app).listen(portHttps, function (err, res) {
        if (err) {
            console.log('Failed to start HTTPS server on port' + portHttps, err);
            return;
        }
        console.log('HTTPS server listening on port ' + portHttps);
    });
}

app.post('/api/auth/logout', function (req, res) {
        clearSessionCookies(req, res);
        return res.ok();
    });

    var clearSessionCookies = function (req, res) {
   //     res.clearCookie(config.session.name, {path: config.session.cookie.path, domain: config.session.cookie.domain});
        res.clearCookie('express_sid'); // FIXME: Absolutely hate this solution. This deletes the EP session, so that on logout also EP session is destroyed. - https://trello.com/c/CkkFUz5D/235-ep-api-authorization-the-way-ep-session-is-invalidated-on-logout
    };
