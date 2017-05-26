"use strict";

var fs = require('fs');
var path = require('path');
var xutil = require('./xutil');
var xinspector = require('./xinspector');

function attach_group(app, namespace, group, more, opts) {
    var interceptors = [];
    xutil.eachArray(xutil.unionArray(xutil.mergeArray(more.interceptors, xutil.parseArray(group.interceptor))), function(name) {
        var func = namespace[name];
        if (!func || typeof func != 'function')
            throw new Error("Not found interceptor: " + name);
        interceptors.push(func);
    });
    var broken_handle;
    if (!group.failure)
        group.failure = more.failure;
    if (group.failure)
        broken_handle = namespace[group.failure];
    else if (interceptors.length > 0 && interceptors[0].length > 2)
        broken_handle = interceptors[0];
    else
        broken_handle = opts.default_failure;
    if (!broken_handle || typeof broken_handle != 'function')
        throw new Error("Not found failure: " + group.failure);
    var step_limit = interceptors.length;
    var step_handing = function(step, handle, req, res) {
        var result = true;
        while (step < step_limit) {
            result = interceptors[step++](req, res);
            if (!result || typeof result == 'function')
                break;
        }
        if (result) {
            if (res.headersSent) {
                throw new Error("Already send response when interceptor passed");
            } else if (typeof result != 'function') {
                handle(req, res);
            } else {
                process.nextTick(function() {
                    result(function(passed) {
                        if (passed)
                            step_handing(step, handle, req, res);
                    });
                });
            }
        } else if (!res.headersSent) {
            throw new Error("Not send response before interceptor return false");
        }
    };
    xutil.eachArray(group.processors, function(processor) {
        var handle = namespace[processor.processor];
        if (!handle || typeof handle != 'function')
            throw new Error("Not found processor: " + processor.processor);
        var inspector = xinspector.create(xutil.unionArray(
            xutil.mergeArray(more.parameters, group.parameters, processor.parameters),
            function(a, b) {
                return a.name == b.name;
            }
        ));
        var workdata = processor.workdata || {};
        var workparam = processor.workparam || {};
        var action = function(req, res, next) {
            if (opts.visitor)
                opts.visitor(req, res);
            var broken_param = inspector.inspect(req.takeParamsRef());
            if (broken_param) {
                if (processor.failure)
                    handle(req, res, broken_param.name, broken_param.type);
                else
                    broken_handle(req, res, broken_param.name, broken_param.type);
            } else {
                req.workdata = workdata;
                req.workparam = workparam;
                step_handing(0, handle, req, res);
            }
        };
        xutil.eachArray(xutil.parseArray(processor.url), function(url) {
            xutil.eachArray(xutil.parseArray(processor.method), function(method) {
                app[method.toLowerCase()](url, action);
            });
        });
    });
}

function attach_router(app, namespace, routepath, opts) {
    var container = require(routepath);
    if (xutil.isArray(container))
        xutil.eachArray(container, function(group) {
            attach_group(app, namespace, group, {
                parameters: [],
                interceptors: [],
                failure: ""
            }, opts);
        });
    else if (container.groups)
        xutil.eachArray(container.groups, function(group) {
            attach_group(app, namespace, group, {
                parameters: container.parameters,
                interceptors: xutil.parseArray(container.interceptor),
                failure: container.failure || ""
            }, opts);
        });
    else
        attach_group(app, namespace, container, {
            parameters: [],
            interceptors: [],
            failure: ""
        }, opts);
}

function setup(app, filepath, opts) {
    var namespace = {};
    var filenames = fs.readdirSync(filepath);
    xutil.eachArray(filenames, function(filename) {
        var pos = filename.lastIndexOf('.');
        if (pos < 1 || filename.substr(pos + 1) != "js")
            return;
        xutil.nsBind(namespace, path.join(filepath, filename), function(key, value) {
            return typeof value == 'function' && key == key.toLowerCase();
        });
    });
    xutil.eachArray(filenames, function(filename) {
        var pos = filename.lastIndexOf('.');
        if (pos < 1 || filename.substr(pos + 1) != "json")
            return;
        attach_router(app, namespace, path.join(filepath, filename), opts);
    });
}

exports.setup = setup;
