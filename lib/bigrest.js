var fs = require('fs');
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

global.brugly = {};

function setup(opts, app) {
    if(!opts)
        opts = {};
    if(!opts.basepath)
        opts.basepath = process.cwd();
    if(!opts.commons)
        opts.commons = "commons";
    if(!opts.methods)
        opts.methods = "methods";
    if(!opts.services)
        opts.services = "services";
    var _brcommons_ = {};
    commons.setup(_brcommons_, path.join(opts.basepath, opts.commons));
    global.brcommons = _brcommons_;
    var _brmethods_ = {};
    methods.setup(_brmethods_, path.join(opts.basepath, opts.methods));
    global.brmethods = _brmethods_;
    if(app) {
        utils.toArray(opts.services).forEach(function(dirname) {
            services.setup(app, path.join(opts.basepath, dirname), opts.visitor);
        });
        if(opts.rootwork) {
            ["get", "post"].forEach(function(method) {
                app[method]("/", opts.rootwork);
            });
        }
    }
}

function listen(port, opts, hostname, backlog, callback) {
    var http = require('http');
    var https = require('https');
    var express = require('express');
    var bodyParser = require('body-parser');
    var multiparty = require('connect-multiparty');

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
        req.param = function(name, defaultValue) {
            var params = this.params;
            if(params && null != params[name] && params.hasOwnProperty(name))
                return params[name];
            var body = this.body;
            if (body && null != body[name])
                return body[name];
            var query = this.query;
            if (query && null != query[name])
                return query[name];
            return defaultValue;
        };
        var fks = req.files? Object.keys(req.files) : [];
        if(fks.length > 0)
            res.on('finish', function() {
                fks.forEach(function(k) {
                    fs.unlink(req.files[k].path);
                });
            });
        next();
    });
    app.use(function(err, req, res, next) {
        res.status(500).send(opts.debug? err.message: text500);
    });
    setup(opts, app);
    app.use(function(err, req, res, next) {
        var errors = [];
        try{
            errors.push(err);
            res.status(500).send(opts.debug? (err.stack || err.message): text500);
        } catch(e) {
            errors.push(e);
        }
        if(errors.length > 0 && opts.catcher)
            opts.catcher(errors, req, res);
    });
    app.use(function(req, res) {
        res.status(404).send(opts.debug? (req.method + " " + req.path): text404);
    });
    var server;
    if(!opts.https)
        server = http.createServer(app);
    else
        server = https.createServer(opts.https, app);
    server.listen(port, hostname, backlog, callback);
};

function present(opts) {
    setup(opts);
}

function simulator(opts) {
    function Request(params) {
        this.params = params;
        this.query = JSON.parse(JSON.stringify(params));
        this.body = this.query;
        this.param = function(name, defValue) {
            var value = this.params[name];
            if(typeof value == 'undefined')
                value = defValue;
            else
                value = '' + value;
            return value;
        };
    }
    function Response(callback) {
        var self = this;
        var ended = false;
        this.status = function(code) {
            return self;
        };
        this.send = function() {
            if(ended)
                throw new Error("already end");
            ended = true;
            var args = [200];
            Array.prototype.slice.call(arguments).forEach(function(o) {
                args.push(o);
            });
            callback.apply(self, args);
        };
        this.end = this.send;
    }
    function SimpleHTTP() {
        var gets = {};
        var posts = {};
        this.get = function(url, callback) {
            gets[url] = callback;
        };
        this.post = function(url, callback) {
            posts[url] = callback;
        };
        this.invoke = function(url, params, callback) {
            var action = gets[url] || posts[url];
            if(!action)
                callback(404, null);
            else
                action(new Request(params), new Response(callback), function(err) {
                    if(err) {
                        throw err;
                    }
                });
        };
    }
    var app = new SimpleHTTP();
    setup(opts, app);
    return new function(){
        this.request = app.invoke;
    };
}

exports.listen = listen;
exports.present = present;
exports.simulator = simulator;
