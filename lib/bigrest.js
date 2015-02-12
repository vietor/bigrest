var express = require('express');
var bodyParser = require('body-parser');
var multiparty = require('connect-multiparty');

var path = require('path');
var router = require('./router');
var methods = require('./methods');

var text404 = '<html>'
        + '<head><title>404 Not Found</title></head>'
        + '<body bgcolor="white">'
        + '<center><h1>404 Not Found</h1></center>'
        + '<hr><center>nginx</center>'
        + '</body>'
        + '</html>';
var text500 = '<html>'
        + '<head><title>500 Internal Server Error</title></head>'
        + '<body bgcolor="white">'
        + '<center><h1>500 Internal Server Error</h1></center>'
        + '<hr><center>nginx</center>'
        + '</body>'
        + '</html>';

global.bigrest = {};

function setup(app, opts) {
    if(!opts.basepath)
        opts.basepath = process.cwd();
    if(!opts.services)
        opts.services = ["services"];
    opts.services.forEach(function(dirname) {
        router.setup(app, path.join(opts.basepath, dirname));
    });
    methods.setup(global.bigrest, path.join(opts.basepath, "methods"));
}

function listen(port, opts) {
    if(!opts)
        opts = {};
    var app = express();
    app.disable('etag');
    app.disable('x-powered-by');
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json({}));
    app.use(multiparty());
    app.use(function(req, res, next) {
        res.setHeader('Server', 'nginx');
        if(opts.nocache) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', 0);
        }
        next();
    });
    app.use(function(err, req, res, next) {
        res.status(500).send(opts.debug? err.stack: text500);
    });
    setup(app, opts);
    app.use(function(err, req, res, next) {
        res.status(500).send(opts.debug? err.stack: text500);
    });
    app.use(function(req, res) {
        res.status(404).send(opts.debug? (req.method + " " + req.path): text404);
    });
    app.listen(port);
};

exports.listen = listen;
