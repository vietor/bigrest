var express = require('express');
var bodyParser = require('body-parser');
var multiparty = require('connect-multiparty');

var path = require('path');
var utils = require('./utils');
var commons = require('./commons');
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

global.brcommons = {};
global.brmethods = {};

function option(opts) {
    if(!opts)
        opts = {};
    if(!opts.basepath)
        opts.basepath = process.cwd();
    return opts;
}

function setup_commons(opts) {
    if(!opts.commons)
        opts.commons = "commons";
    commons.setup(global.brcommons, path.join(opts.basepath, opts.commons));
}

function setup_methods(opts) {
    if(!opts.methods)
        opts.methods = "methods";
    methods.setup(global.brmethods, path.join(opts.basepath, opts.methods));
}

function setup_services(opts, app) {
    if(!opts.services)
        opts.services = "services";
    utils.toArray(opts.services).forEach(function(dirname) {
        services.setup(app, path.join(opts.basepath, dirname));
    });
}

function listen(port, opts) {
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
        res.status(500).send(opts.debug? err.message: text500);
    });
    opts = option(opts);
    setup_commons(opts);
    setup_methods(opts);
    setup_services(opts, app);
    app.use(function(err, req, res, next) {
        try{
            res.status(500).send(opts.debug? err.message: text500);
        } catch(e) {
            console.error("HTTP[500]: ", e.message);
        }
    });
    app.use(function(req, res) {
        res.status(404).send(opts.debug? (req.method + " " + req.path): text404);
    });
    app.listen(port);
};

function present(opts) {
    opts = option(opts);
    setup_commons(opts);
    setup_methods(opts);
}

exports.listen = listen;
exports.present = present;
