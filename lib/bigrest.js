"use strict";

var fs = require('fs');
var path = require('path');
var xutil = require('./xutil');
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

function options(opts) {
    if(!opts)
        opts = {};
    if(!opts.basepath)
        opts.basepath = process.cwd();
    if(!opts.services)
        opts.services = "services";
    return opts;
}

function present(opts) {
    var _brcommons_ = {};
    commons.setup(_brcommons_, path.join(opts.basepath, "commons"));
    global.brcx = global.brcommons = _brcommons_;
    var _brmethods_ = {};
    methods.setup(_brmethods_, path.join(opts.basepath, "methods"));
    global.brmx = global.brmethods = _brmethods_;
}

function weblike(opts) {
    var express = require('express');
    var session = require('express-session');
    var bodyParser = require('body-parser');
    var cookieParser = require('cookie-parser');
    var multiparty = require('connect-multiparty');

    present(opts);

    var app = express();
    app.disable('etag');
    app.disable('x-powered-by');
    app.enable('trust proxy');
    if(opts.viewer) {
        if(typeof opts.viewer.filepath != 'string')
            throw new Error("Bad option: viewer.filepath");
        var renderType = typeof opts.viewer.render;
        if(["string", "function"].indexOf(renderType) == -1)
            throw new Error("Bad option: viewer.render");
        if(!opts.debug)
            app.set('view cache', true);
        app.set('views', opts.viewer.filepath);
        if(renderType == 'string')
            app.set('view engine', opts.viewer.render);
        else {
            app.set('view engine', 'html');
            app.engine('html', opts.viewer.render);
        }
    }
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json({}));
    app.use(cookieParser());
    app.use(multiparty());
    if(opts.session) {
        var store = opts.session.store;
        if(store && typeof(store) == 'function')
            opts.session.store = store(session);
        app.use(session(xutil.objExtend({
            name: 'SESSIONID',
            resave: false,
            saveUninitialized: false
        },opts.session)));
    }
    xutil.mkArray(opts.middlewares).forEach(function(middleware) {
        app.use(middleware);
    });
    app.use(function(req, res, next) {
        res.setHeader('Server', 'nginx');
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
        if(opts.debug)
            console.log(err.stack);
        res.status(500).send(opts.debug? err.message: text500);
    });
    if(opts.rootwork) {
        app.all("/", opts.rootwork);
    }
    xutil.toArray(opts.services).forEach(function(dirname) {
        services.setup(app, path.join(opts.basepath, dirname), xutil.objExtend({
            visitor: opts.visitor
        }, opts._private));
    });
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
    if(opts.static) {
        if(typeof opts.static.urlpath != 'string')
            throw new Error("Bad option: static.urlpath");
        if(typeof opts.static.filepath != 'string')
            throw new Error("Bad option: static.filepath");
        app.use(opts.static.urlpath, express.static(opts.static.filepath));
    }
    app.use(function(req, res) {
        res.status(404).send(opts.debug? (req.method + " " + req.path): text404);
    });
    return app;
}

exports.present = function(opts) {
    present(options(opts));
};

exports.listen = function(port, opts) {
    opts = options(opts);
    var http = require('http');
    var https = require('https');

    var server;
    var webapp = weblike(opts);
    if(!opts.https)
        server = http.createServer(webapp);
    else
        server = https.createServer(opts.https, webapp);
    var new_arguments = [port];
    for(var i = 2; i < arguments.length; ++i)
        new_arguments.push(arguments[i]);
    server.listen.apply(server, new_arguments);
};

exports.simulator = function(opts) {
    opts = options(opts);
    var http = require('http');
    var qs = require('querystring');

    opts._private = {
        throwable: true
    };
    var webapp = weblike(opts);
    return {
        request: function(method, url, params, callback) {
            var fakereq = (function() {
                var qss = qs.stringify(params);
                var req = new http.IncomingMessage();
                req.url = url;
                req.method = method.toUpperCase();
                if(req.method == 'GET') {
                    if(req.url.indexOf('?') == -1)
                        req.url += '?';
                    else
                        req.url += '&';
                    req.url += qss;
                }
                else {
                    var readed = false;
                    var buffer = new Buffer(qss);
                    req.headers['content-type'] = 'application/x-www-form-urlencoded';
                    req.headers['content-length'] = buffer.length;
                    req._read = function() {
                        if(readed)
                            req.push(null);
                        else {
                            readed = true;
                            req.push(buffer);
                        }
                    };
                }
                req.ip = xutil.getFakeIp();
                req.ips = [req.ip];
                return req;
            })();
            var fakeres = (function() {
                var res = new http.ServerResponse(fakereq);
                res.send = function(data) {
                    res.send = function() {};
                    callback(res.statusCode, data);
                };
                return res;
            })();
            webapp(fakereq, fakeres);
        }
    };
};
