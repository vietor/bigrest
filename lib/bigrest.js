"use strict";

var fs = require('fs');
var path = require('path');
var xutil = require('./xutil');
var commons = require('./commons');
var methods = require('./methods');
var services = require('./services');

var template = xutil.readFileText('code.html');
var codetexts = (function() {
    var texts = {};
    var jsontext = xutil.readFileText('codes.json');
    xutil.forEach(JSON.parse(jsontext), function(message, code) {
        texts[code] = xutil.renderTemplateText(template, {
            code: code,
            message: message
        });
    });
    return texts;
})();

function ishttperr(err) {
    return err && (err.statusCode && err.status) && (err.statusCode == err.status) && (err.status >= 100 && err.status < 600);
}

function textcode(code) {
    return codetexts[code] || xutil.renderTemplateText(template, {
        code: code,
        message: 'Unexpected Error'
    });
}

function options(opts) {
    if (!opts)
        opts = {};
    if (!opts.limits)
        opts.limits = {};
    if (!opts.basepath)
        opts.basepath = process.cwd();
    if (!opts.services)
        opts.services = "services";
    opts._privates = {
        default_failure: function(req, res, name, type) {
            res.status(400).send(opts.debug ? ("[" + name + ":" + type + "] " + req.path) : textcode(400));
        }
    };
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
    var bodyParser = require('body-parser');
    var cookieParser = require('cookie-parser');
    var multer = require('multer');
    var compression = require('compression');

    present(opts);

    var app = express();
    if (!opts.etag)
        app.disable('etag');
    app.disable('x-powered-by');
    app.enable('trust proxy');
    if (opts.compression) {
        var compressionOptions = {};
        if (opts.compression !== true)
            compressionOptions = opts.compression;
        app.use(compression(compressionOptions));
    }
    if (opts.viewer) {
        var renderType = typeof opts.viewer.render;
        if (["string", "function"].indexOf(renderType) == -1)
            throw new Error("Bad option: viewer.render");
        if (typeof opts.viewer.filepath != 'string')
            throw new Error("Bad option: viewer.filepath");
        app.set('views', opts.viewer.filepath);
        if (renderType == 'string')
            app.set('view engine', opts.viewer.render);
        else {
            app.set('view engine', 'html');
            app.engine('html', opts.viewer.render);
        }
        app.set('view cache', xutil.optBoolean(opts.viewer.cache, !opts.debug));
    }
    var bodySize = opts.limits.bodySize || (4 * 1024 * 1024);
    app.use(bodyParser.json({
        strict: true,
        limit: bodySize
    }));
    app.use(bodyParser.urlencoded({
        extended: false,
        limit: bodySize
    }));
    app.use(multer({
        storage: multer.diskStorage({}),
        limits: {
            fieldNameSize: 256,
            fieldSize: bodySize,
            fileSize: opts.limits.uploadSize || (50 * 1024 * 1024)
        }
    }).any());
    app.use(function(req, res, next) {
        if (req.files) {
            req.files = xutil.mapArray(req.files || [], function(file) {
                return {
                    name: file.fieldname,
                    type: file.mimetype,
                    size: file.size,
                    path: file.path,
                    originalFilename: file.originalname
                };
            });
        }
        next();
    });
    app.use(cookieParser());
    xutil.forEach(opts.middlewares, function(middleware) {
        app.use(middleware);
    });
    app.use(function(req, res, next) {
        res.setHeader('Server', 'nginx');
        req.takeParamsRef = function() {
            if (!req.__bigrest_params)
                req.__bigrest_params = xutil.objExtend({}, req.query || {}, req.body || {}, req.params || {});
            return req.__bigrest_params;
        };
        req.param = function(name, defaultValue) {
            var value = req.takeParamsRef()[name];
            if (xutil.isNullOrUndefined(value))
                value = defaultValue;
            return value;
        };
        var fks = req.files || [];
        if (fks.length > 0) {
            res.on('finish', function() {
                xutil.forEach(fks, function(k) {
                    try {
                        fs.unlinkSync(k.path);
                    } catch (e) {}
                });
            });
        }
        next();
    });
    if (opts.rootwork) {
        app.all("/", opts.rootwork);
    }
    xutil.forEach(xutil.parseArray(opts.services), function(dirname) {
        services.setup(app, path.join(opts.basepath, dirname), xutil.objExtend({
            visitor: opts.visitor
        }, opts._privates));
    });
    if (opts.statics) {
        xutil.forEach(xutil.parseArray(opts.statics), function(row) {
            if (typeof row.urlpath != 'string')
                throw new Error("Bad option: static.urlpath");
            if (typeof row.filepath != 'string')
                throw new Error("Bad option: static.filepath");
            app.use(row.urlpath, express.static(row.filepath, row.options || {}));
        });
    }
    if (opts.r404work) {
        app.use(opts.r404work);
    }
    app.use(function(req, res) {
        res.status(404).send(opts.debug ? (req.method + " " + req.path) : textcode(404));
    });
    app.use(function(err, req, res, next) {
        // Add error entry lock
        if (res.headersSent || req.__bigrest_error_lock)
            next();
        else {
            req.__bigrest_error_lock = true;

            var errors = [],
                recatch = false;
            try {
                var statusCode = 500;
                if (!ishttperr(err))
                    errors.push(err);
                else
                    statusCode = err.statusCode;
                res.status(statusCode).send(opts.debug ? (err.stack || err.message) : textcode(statusCode));
            } catch (e) {
                errors.push(e);
                recatch = true;
            }
            if (opts.catcher && errors.length > 0) {
                try {
                    opts.catcher(errors, req, res);
                } catch (e) {
                    recatch = true;
                }
            }
            // Use the default handler when error again
            if (!recatch || res.headersSent)
                next();
            else
                next(err);
        }
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
    if (!opts.https)
        server = http.createServer(webapp);
    else
        server = https.createServer(opts.https, webapp);
    var new_arguments = [port];
    for (var i = 2; i < arguments.length; ++i)
        new_arguments.push(arguments[i]);
    server.listen.apply(server, new_arguments);
};

exports.simulator = function(opts) {
    opts = xutil.objExtend({
        debug: true
    }, options(opts));

    var http = require('http');
    var qs = require('querystring');

    var webapp = weblike(opts);
    return {
        request: function(method, url, params, callback) {
            var fakereq = (function() {
                var qss = qs.stringify(params);
                var req = new http.IncomingMessage();
                req.url = url;
                req.method = method.toUpperCase();
                if (req.method == 'GET') {
                    if (req.url.indexOf('?') == -1)
                        req.url += '?';
                    else
                        req.url += '&';
                    req.url += qss;
                } else {
                    var readed = false;
                    var buffer = new Buffer(qss);
                    req.headers['content-type'] = 'application/x-www-form-urlencoded';
                    req.headers['content-length'] = buffer.length;
                    req._read = function() {
                        if (readed)
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
                var resend = false;
                var res = new http.ServerResponse(fakereq);
                res.send = function(data) {
                    if (resend)
                        return;
                    resend = true;
                    process.nextTick(function() {
                        callback(res.statusCode, data);
                    });
                };
                return res;
            })();
            webapp(fakereq, fakeres);
        }
    };
};
