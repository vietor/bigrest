var fs = require('fs');
var path = require('path');
var domain = require('domain');
var utils = require('./utils');

function prepare_param(req, parameter) {
    var name = parameter.name;
    var value = req.param[name] || req.body[name] || req.query[name];
    if(!value) {
        if(parameter.default)
            req.params[name] = '' + parameter.default;
        else if(!parameter.empty) {
            if(!parameter.candidate)
                return false;
            else if(!req.param(parameter.candidate))
                return false;
        }
    }
    else {
        if(parameter.trim) {
            value = value.trim();
            if(!value)
                return false;
            req.params[name] = value.trim();
        }
        if(parameter.length_min && value.length < parameter.length_min)
            return false;
        if(parameter.length_max && value.length > parameter.length_max)
            return false;
        if(parameter.digit && isNaN(parseInt(value)))
            return false;
        if(parameter.word && /\W/.test(value))
            return false;
        if(parameter.values) {
            if(parameter.values.every(function(val) {
                return value != val;
            }))
                return false;
        }
    }
    return true;
}

function attach_group(app, namespace, group, more, visitor) {
    var interceptors = [];
    more.interceptors.concat(utils.toArray(group.interceptor)).forEach(function(name) {
        var func = namespace[name];
        if (!func || typeof func != 'function')
            throw new Error("Not found interceptor: " + name);
        interceptors.push(func);
    });
    var broken_handle;
    if(!group.broken_interceptor)
        group.broken_interceptor = more.broken_interceptor;
    if(group.broken_interceptor)
        broken_handle = namespace[group.broken_interceptor];
    else if(interceptors.length > 0 && interceptors[0].length > 2)
        broken_handle = interceptors[0];
    if (!broken_handle || typeof broken_handle != 'function')
        throw new Error("Not found broken interceptor: " + group.broken_interceptor);
    group.processors.forEach(function(processor) {
        var method = processor.method.toLowerCase();
        var handle = namespace[processor.processor];
        if (!handle || typeof handle != 'function')
            throw new Error("Not found processor: " + processor.processor);
        var parameters = more.parameters;
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
            var broken_parameter = null;
            for (var i = 0; i < parameters.length; i++) {
                var parameter = parameters[i];
                if(!prepare_param(req, parameter)) {
                    broken_parameter = parameter;
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
                if(broken_parameter)
                    broken_handle(req, res, broken_parameter.name);
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
        utils.toArray(processor.url).forEach(function(url) {
            app[method](url, action);
        });
    });
}

function attach_router(app, namespace, routepath, visitor) {
    var container = require(routepath);
    if(utils.isArray(container))
        container.forEach(function(group) {
            attach_group(app, namespace, group, {
                parameters: [],
                interceptors: [],
                broken_interceptor: ""
            }, visitor);
        });
    else if(container.groups)
        container.groups.forEach(function(group) {
            attach_group(app, namespace, group, {
                parameters: utils.toArray(container.parameters),
                interceptors: utils.toArray(container.interceptor),
                broken_interceptor: container.broken_interceptor || ""
            }, visitor);
        });
    else
        attach_group(app, namespace, container, {
            parameters: [],
            interceptors: [],
            broken_interceptor: ""
        }, visitor);
}

function setup(app, filepath, visitor) {
    var namespace = {};
    var filenames = fs.readdirSync(filepath);
    filenames.forEach(function(filename) {
        var pos = filename.lastIndexOf('.');
        if(pos < 1)
            return;
        var prefix = filename.substr(0, pos);
        var stuffix = filename.substr(pos + 1);
        if(stuffix != "js")
            return;
        utils.nsBind(namespace, path.join(filepath, prefix), function(key, value) {
            return typeof value == 'function' && key == key.toLowerCase();
        });
    });
    filenames.forEach(function(filename) {
        var sep = '_';
        var pos = filename.lastIndexOf(sep);
        if(pos < 1) {
            sep = '-';
            pos = filename.lastIndexOf(sep);
            if(pos < 1)
                return;
        }
        var prefix = filename.substr(0, pos);
        var stuffix = filename.substr(pos + 1);
        if(stuffix != "router.json")
            return;
        attach_router(app, namespace, path.join(filepath, prefix + sep + "router"), visitor);
    });
};

exports.setup = setup;
