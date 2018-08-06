'use strict';

var express = require('express');
var app = express();
var https = require('https');
var path = require('path');
var http = require('http');
var fs = require('fs');
var _ = require('lodash');

var prerender = require('prerender-node');

var settingsLocal = null; // Your local config in '/config/local.json'
var settingsEnv = null; // Settings defined in environment variable 'ETHERPAD_SETTINGS'

try {
    settingsLocal = require('./config/local.json');
} catch (err) {
    console.log('local.json NOT found!', err)
}

if (process.env.COS_CONFIG) {
    try {
        settingsEnv = JSON.parse(process.env.COS_CONFIG);
    } catch (err) {
        console.error('COS_CONFIG INVALID! Please make sure defined value is a valid JSON string!', err);
        process.exit(1);
    }
} else {
    console.log('COS_CONFIG NOT found!');
}

if (!settingsLocal && !settingsEnv) {
    console.log('No configuration provided! You must provide at least one in "/config/local.json" file or "COS_CONFIG" environment variable.');
    process.exit(1);
}

var settings = _.merge(settingsLocal || {}, settingsEnv || {});

var pathSettings = path.resolve('./public/settings.js');
try {
    var settingsFileTxt = '(function (window) { window.__config = window.__config || {};';
    _(settings).forEach(function (value, key) {
        settingsFileTxt += ' window.__config.'+key+' = ' + JSON.stringify(value) + ';';
    });
    settingsFileTxt += '}(this));';
    fs.writeFileSync(pathSettings, settingsFileTxt);
} catch (err) {
    console.log('Settings.json write FAILED to ' + pathSettings, err);
    process.exit(1);
}

app.use(prerender.set('prerenderToken', 'CrrAflHAEiF44KMFkrs7'));

app.use(express.static(__dirname + '/public'));

app.get('/*', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

var host = process.env.HOST || null;

var portHttp = process.env.PORT || 3000;
http.createServer(app).listen(portHttp, host, function (err, res) {
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

    https.createServer(options, app).listen(portHttps, host, function (err, res) {
        if (err) {
            console.log('Failed to start HTTPS server on port' + portHttps, err);
            return;
        }
        console.log('HTTPS server listening on port ' + portHttps);
    });
}
