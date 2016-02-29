"use strict";

var fs = require('fs');
var path = require('path');
var xutil = require('./xutil');

var PARAM_OK = "";
var PARAM_EMPTY = "empty";
var PARAM_LENGTH = "length";
var PARAM_TYPE = "type";
var PARAM_VALUE = "value";
var PARAM_MATCH = "value";

function is_digit(value) {
    return !(!/^\-?[\d\.]+$/.test(value) || isNaN(parseInt(value)));
}

function prepare_param(req, parameter) {
    var name = parameter.name;
    var value = req.param(name);
    if (!value && value !== 0) {
        if (parameter.default || parameter.default === 0)
            req.params[name] = '' + parameter.default;
        else if (!parameter.empty) {
            if (!parameter.candidate)
                return PARAM_EMPTY;
            else if (!req.param(parameter.candidate))
                return PARAM_EMPTY;
        }
    } else {
        if (parameter.trim) {
            value = value.trim();
            if (!value)
                return PARAM_EMPTY;
            req.params[name] = value.trim();
        }
        if (parameter.length_min && value.length < parameter.length_min)
            return PARAM_LENGTH;
        if (parameter.length_max && value.length > parameter.length_max)
            return PARAM_LENGTH;
        if (parameter.digit && !is_digit(value))
            return PARAM_TYPE;
        if (parameter.word && /\W/.test(value))
            return PARAM_TYPE;
        if (parameter.regexp && !(new RegExp(parameter.regexp).test(value)))
            return PARAM_TYPE;
        if (parameter.values) {
            if (parameter.values.every(function(val) {
                    return value != val;
                }))
                return PARAM_VALUE;
        }
        if (parameter.range && xutil.isArray(parameter.range) && parameter.range.length == 2) {
            if (!is_digit(value))
                return PARAM_TYPE;
            var num = parseInt(value);
            if (num < parameter.range[0] || num > parameter.range[1])
                return PARAM_VALUE;
        }
        if (parameter.match) {
            if (value != req.param(parameter.match))
                return PARAM_MATCH;
        }
    }
    return PARAM_OK;
}

function attach_group(app, namespace, group, more, opts) {
    var interceptors = [];
    xutil.eachArray(xutil.unionArray(xutil.mergeArray(more.interceptors, xutil.toArray(group.interceptor))), function(name) {
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
            if (typeof result != 'function') {
                handle(req, res);
            } else {
                process.nextTick(function() {
                    result(function(passed) {
                        if (passed)
                            step_handing(step, handle, req, res);
                    });
                });
            }
        }
    };
    xutil.eachArray(group.processors, function(processor) {
        var handle = namespace[processor.processor];
        if (!handle || typeof handle != 'function')
            throw new Error("Not found processor: " + processor.processor);
        var parameters = xutil.mergeArray(more.parameters, xutil.toArray(group.parameters), xutil.toArray(processor.parameters));
        xutil.eachArray(parameters, function(parameter, i) {
            if (typeof parameter == 'string')
                parameters[i] = {
                    name: parameter
                };
        });
        parameters = xutil.unionArray(parameters, function(a, b) {
            return a.name == b.name;
        });
        var workdata = processor.workdata || {};
        var workparam = processor.workparam || {};
        var action = function(req, res, next) {
            if (opts.visitor)
                opts.visitor(req, res);
            var broken_param = null;
            for (var i = 0, length = parameters.length; i < length; i++) {
                var param = parameters[i];
                var type = prepare_param(req, param);
                if (type) {
                    broken_param = {
                        name: param.name,
                        type: type
                    };
                    break;
                }
            }
            var catcher = xutil.createCatcher(opts.simulator);
            catcher.add(interceptors);
            catcher.add(step_handing);
            catcher.add(handle);
            catcher.add(broken_handle);
            catcher.on('error', function(err) {
                next(err);
            });
            catcher.run(function() {
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
            });
        };
        xutil.eachArray(xutil.toArray(processor.url), function(url) {
            xutil.eachArray(xutil.toArray(processor.method), function(method) {
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
                parameters: xutil.toArray(container.parameters),
                interceptors: xutil.toArray(container.interceptor),
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
