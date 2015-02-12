var express = require('express');
var bodyParser = require('body-parser');
var multiparty = require('connect-multiparty');

var path = require('path');
var methods = require('./methods');
var services = require('./services');

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

global.brmethods = {};

function option(opts) {
    if(!opts)
        opts = {};
    if(!opts.basepath)
        opts.basepath = process.cwd();
    return opts;
}

function setup_methods(opts) {
    methods.setup(global.brmethods, path.join(opts.basepath, "methods"));
}

function setup_services(opts, app) {
    if(!opts.services)
        opts.services = ["services"];
    opts.services.forEach(function(dirname) {
        services.setup(app, path.join(opts.basepath, dirname));
    });
}

function listen(port, opts) {
    opts = option(opts);
    setup_methods(opts);

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
    setup_services(opts, app);
    app.use(function(err, req, res, next) {
        res.status(500).send(opts.debug? err.stack: text500);
    });
    app.use(function(req, res) {
        res.status(404).send(opts.debug? (req.method + " " + req.path): text404);
    });
    app.listen(port);
};

function present(opts) {
    opts = option(opts);
    setup_methods(opts);
}

exports.listen = listen;
exports.present = present;
