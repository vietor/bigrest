"use strict";

var fs = require('fs');
var path = require('path');
var domain = require('domain');
var xutil = require('./xutil');

var PARAM_OK = "";
var PARAM_EMPTY = "empty";
var PARAM_LENGTH = "length";
var PARAM_TYPE = "type";
var PARAM_VALUE = "value";

function prepare_param(req, parameter) {
    var name = parameter.name;
    var value = req.param[name] || req.body[name] || req.query[name];
    if(!value && value !== 0) {
        if(parameter.default || parameter.default === 0)
            req.params[name] = '' + parameter.default;
        else if(!parameter.empty) {
            if(!parameter.candidate)
                return PARAM_EMPTY;
            else if(!req.param(parameter.candidate))
                return PARAM_EMPTY;
        }
    }
    else {
        if(parameter.trim) {
            value = value.trim();
            if(!value)
                return PARAM_EMPTY;
            req.params[name] = value.trim();
        }
        if(parameter.length_min && value.length < parameter.length_min)
            return PARAM_LENGTH;
        if(parameter.length_max && value.length > parameter.length_max)
            return PARAM_LENGTH;
        if(parameter.digit && (!/^\-?[\d\.]+$/.test(value) || isNaN(parseInt(value))))
            return PARAM_TYPE;
        if(parameter.word && /\W/.test(value))
            return PARAM_TYPE;
        if(parameter.regexp && !(new RegExp(parameter.regexp).test(value)))
            return PARAM_TYPE;
        if(parameter.values) {
            if(parameter.values.every(function(val) {
                return value != val;
            }))
                return PARAM_VALUE;
        }
    }
    return PARAM_OK;
}

function attach_group(app, namespace, group, more, visitor) {
    var interceptors = [];
    more.interceptors.concat(xutil.toArray(group.interceptor)).forEach(function(name) {
        var func = namespace[name];
        if (!func || typeof func != 'function')
            throw new Error("Not found interceptor: " + name);
        interceptors.push(func);
    });
    var broken_handle;
    if(!group.failure)
        group.failure = more.failure;
    if(group.failure)
        broken_handle = namespace[group.failure];
    else if(interceptors.length > 0 && interceptors[0].length > 2)
        broken_handle = interceptors[0];
    if (!broken_handle || typeof broken_handle != 'function')
        throw new Error("Not found failure: " + group.failure);
    var group_parameters = more.parameters;
    if(group.parameters)
        group_parameters = group_parameters.concat(group.parameters);
    group.processors.forEach(function(processor) {
        var method = processor.method.toLowerCase();
        var handle = namespace[processor.processor];
        if (!handle || typeof handle != 'function')
            throw new Error("Not found processor: " + processor.processor);
        var parameters = group_parameters;
        if(processor.parameters)
            parameters = parameters.concat(processor.parameters);
        for (var i = 0; i < parameters.length; i++) {
            var parameter = parameters[i];
            if(typeof parameter == 'string')
                parameters[i] = {name: parameter};
        }
        var workdata = processor.workdata || {};
        var workparam = processor.workparam || {};
        var action = function(req, res, next) {
            if(visitor)
                visitor(req, res);
            var broken_param = null;
            for (var i = 0; i < parameters.length; i++) {
                var param = parameters[i];
                var type = prepare_param(req, param);
                if(type) {
                    broken_param = {
                        name: param.name,
                        type: type
                    };
                    break;
                }
            }
            var catcher = domain.create();
            catcher.add(handle);
            catcher.add(interceptors);
            catcher.add(broken_handle);
            catcher.on('error', function(err) {
                next(err);
            });
            catcher.run(function() {
                if(broken_param)
                    broken_handle(req, res, broken_param.name, broken_param.type);
                else{
                    req.workdata = workdata;
                    req.workparam = workparam;
                    var run_interceptors = function(step) {
                        var result = true;
                        while(step < interceptors.length) {
                            result = interceptors[step++](req, res);
                            if(!result || typeof result == 'function')
                                break;
                        }
                        if(result) {
                            if(typeof result != 'function') {
                                handle(req, res);
                            }
                            else {
                                process.nextTick(function() {
                                    result(function(passed) {
                                        if(passed)
                                            run_interceptors(step);
                                    });
                                });
                            }
                        };
                    };
                    run_interceptors(0);
                }
            });
        };
        xutil.toArray(processor.url).forEach(function(url) {
            app[method](url, action);
        });
    });
}

function attach_router(app, namespace, routepath, visitor) {
    var container = require(routepath);
    if(xutil.isArray(container))
        container.forEach(function(group) {
            attach_group(app, namespace, group, {
                parameters: [],
                interceptors: [],
                failure: ""
            }, visitor);
        });
    else if(container.groups)
        container.groups.forEach(function(group) {
            attach_group(app, namespace, group, {
                parameters: xutil.toArray(container.parameters),
                interceptors: xutil.toArray(container.interceptor),
                failure: container.failure || ""
            }, visitor);
        });
    else
        attach_group(app, namespace, container, {
            parameters: [],
            interceptors: [],
            failure: ""
        }, visitor);
}

function setup(app, filepath, visitor) {
    var namespace = {};
    var filenames = fs.readdirSync(filepath);
    filenames.forEach(function(filename) {
        var pos = filename.lastIndexOf('.');
        if(pos < 1 || filename.substr(pos + 1) != "js")
            return;
        xutil.nsBind(namespace, path.join(filepath, filename), function(key, value) {
            return typeof value == 'function' && key == key.toLowerCase();
        });
    });
    filenames.forEach(function(filename) {
        var pos = filename.lastIndexOf('.');
        if(pos < 1 || filename.substr(pos + 1) != "json")
            return;
        attach_router(app, namespace, path.join(filepath, filename), visitor);
    });
};

exports.setup = setup;
