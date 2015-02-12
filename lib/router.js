var fs = require('fs');
var path = require('path');
var util = require('util');

function bind(namespace, modulepath) {
    var container = require(modulepath);
    if(container["disable"])
        return;
    Object.keys(container).forEach(function(key) {
        var value = container[key];
        if(key == key.toLowerCase()) {
            if(namespace[key])
                throw new Error('Duplicated key: ' + key);
            namespace[key] = value;
        }
    });
}

function as_array(obj) {
    if (typeof obj == 'undefined')
        return [];
    else if(!util.isArray(obj))
        return [obj];
    else
        return obj;
}

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

function attach_group(app, namespace, group, more) {
    var interceptors = [];
    more.interceptors.concat(as_array(group.interceptor)).forEach(function(name) {
        var func = namespace[name];
        if (!func || typeof func != 'function')
            throw new Error("Not found interceptor: " + name);
        interceptors.push(func);
    });
    if(!group.broken_processor)
        group.broken_processor = more.broken_processor;
    var broken_handle = namespace[group.broken_processor];
    if (!broken_handle || typeof broken_handle != 'function')
        throw new Error("Not found broken processor: " + group.broken_processor);
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
        var action = function(req, res) {
            var broken_parameter = null;
            for (var i = 0; i < parameters.length; i++) {
                var parameter = parameters[i];
                if(!prepare_param(req, parameter)) {
                    broken_parameter = parameter;
                    break;
                }
            }
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
                        if(typeof result != 'function')
                            handle(req, res);
                        else
                            process.nextTick(function() {
                                result(function(passed) {
                                    if(passed)
                                        run_interceptors(step);
                                });
                            });
                    };
                };
                run_interceptors(0);
            }
        };
        as_array(processor.url).forEach(function(url) {
            app[method](url, action);
        });
    });
}

function attach_router(app, namespace, routepath) {
    var container = require(routepath);
    if(util.isArray(container))
        container.forEach(function(group) {
            attach_group(app, namespace, group, {
                parameters: [],
                interceptors: []
            });
        });
    else if(container.groups)
        container.groups.forEach(function(group) {
            attach_group(app, namespace, group, {
                parameters: as_array(container.parameters),
                interceptors: as_array(container.interceptor),
                broken_processor: container.broken_processor || ""
            });
        });
    else
        attach_group(app, namespace, container, {
            parameters: [],
            interceptors: []
        });
}

function setup(app, filepath) {
    var namespace = {};
    var filenames = fs.readdirSync(filepath);
    filenames.forEach(function(filename) {
        var pos = filename.lastIndexOf('.');
        if(pos < 1)
            return;
        var prefix = filename.substr(0, pos);
        var stuffix = filename.substr(pos + 1);
        if(stuffix === "js")
            bind(namespace, path.join(filepath, prefix));
    });
    filenames.forEach(function(filename) {
        var pos = filename.lastIndexOf('-');
        if(pos < 1)
            return;
        var prefix = filename.substr(0, pos);
        var stuffix = filename.substr(pos + 1);
        if(stuffix === "router.json")
            attach_router(app, namespace, path.join(filepath, prefix + "-router"));
    });
};

exports.setup = setup;
