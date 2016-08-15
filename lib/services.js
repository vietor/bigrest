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

function WordTester() {
    var regexp = /\W/;
    this.test = function(value) {
        regexp.lastIndex = 0;
        return !regexp.test(value);
    };
}

function DigitTester() {
    var regexp = /^\-?[\d\.]+$/;
    this.test = function(value) {
        regexp.lastIndex = 0;
        return regexp.test(value) && !isNaN(parseInt(value));
    };
}

function RegExTester(pattern) {
    var regexp = new RegExp(pattern);
    this.test = function(value) {
        regexp.lastIndex = 0;
        return regexp.test(value);
    };
}

function RangeTester(min, max) {
    this.test = function(value) {
        return value >= min && value <= max;
    };
}

function RangeMinTester(min) {
    this.test = function(value) {
        return value >= min;
    };
}

function RangeMaxTester(max) {
    this.test = function(value) {
        return value <= max;
    };
}


function LengthTester(min, max) {
    this.test = function(value) {
        var length = value.length;
        return length >= min && length <= max;
    };
}

function LengthMinTester(min) {
    this.test = function(value) {
        return value.length >= min;
    };
}

function LengthMaxTester(max) {
    this.test = function(value) {
        return value.length <= max;
    };
}

function ValuesTester(values) {
    this.test = function(value) {
        return xutil.eachBreakArray(values, function(val) {
            return value == val;
        });
    };
}

function render_parameters(parameters) {
    return xutil.mapArray(parameters, function(origin) {
        if (typeof origin == 'string') {
            origin = {
                name: origin
            };
        }
        var has_min, has_max, parameter = {
            name: origin.name,
            default: origin.default,
            empty: origin.empty || false,
            match: origin.match,
            candidate: origin.candidate,
            trim: origin.trim || false
        };
        if (origin.word)
            parameter.word = new WordTester().test;
        if (origin.digit)
            parameter.digit = new DigitTester().test;
        if (origin.regexp)
            parameter.regexp = new RegExTester(origin.regexp).test;
        if (origin.range) {
            if (!xutil.isArray(origin.range) || origin.range.length != 2)
                throw new Error("Wrong parameter: range (" + origin.name + ")");
            else
                parameter.value_range = new RangeTester(origin.range[0], origin.range[1]).test;
        } else {
            has_min = !xutil.isNullOrUndefined(origin.range_min);
            has_max = !xutil.isNullOrUndefined(origin.range_max);
            if (has_min && has_max)
                parameter.value_range = new RangeTester(origin.range_min, origin.range_max).test;
            else if (has_min)
                parameter.value_range = new RangeMinTester(origin.range_min).test;
            else if (has_max)
                parameter.value_range = new RangeMaxTester(origin.range_max).test;
        }
        if (origin.length) {
            if (!xutil.isArray(origin.length) || origin.length.length != 2)
                throw new Error("Wrong parameter: length (" + origin.name + ")");
            else
                parameter.length_range = new LengthTester(origin.length[0], origin.length[1]).test;
        } else {
            has_min = !xutil.isNullOrUndefined(origin.length_min);
            has_max = !xutil.isNullOrUndefined(origin.length_max);
            if (has_min && has_max)
                parameter.length_range = new LengthTester(origin.length_min, origin.length_max).test;
            else if (has_min)
                parameter.length_range = new LengthMinTester(origin.length_min).test;
            else if (has_max)
                parameter.length_range = new LengthMaxTester(origin.length_max).test;
        }
        if (origin.values) {
            if (!xutil.isArray(origin.values) || origin.values.length < 1)
                throw new Error("Wrong parameter: values (" + origin.name + ")");
            else
                parameter.values = new ValuesTester(origin.values).test;
        }
        return parameter;
    });
}

function validate_parameter(req, parameter) {
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
        if (parameter.length_range && !parameter.length_range(value))
            return PARAM_LENGTH;
        if (parameter.digit && !parameter.digit(value))
            return PARAM_TYPE;
        if (parameter.word && !parameter.word(value))
            return PARAM_TYPE;
        if (parameter.regexp && !parameter.regexp(value))
            return PARAM_TYPE;
        if (parameter.values && !parameter.values(value))
            return PARAM_VALUE;
        if (parameter.value_range && !parameter.value_range(value))
            return PARAM_VALUE;
        if (parameter.match) {
            if (value != req.param(parameter.match))
                return PARAM_MATCH;
        }
    }
    return PARAM_OK;
}

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
    var group_parameters = render_parameters(group.parameters);
    xutil.eachArray(group.processors, function(processor) {
        var handle = namespace[processor.processor];
        if (!handle || typeof handle != 'function')
            throw new Error("Not found processor: " + processor.processor);
        var parameters = xutil.unionArray(
            xutil.mergeArray(more.parameters, group_parameters, render_parameters(processor.parameters)),
            function(a, b) {
                return a.name == b.name;
            }
        );
        var workdata = processor.workdata || {};
        var workparam = processor.workparam || {};
        var action = function(req, res, next) {
            if (opts.visitor)
                opts.visitor(req, res);
            var broken_param = null;
            xutil.eachBreakArray(parameters, function(param) {
                var type = validate_parameter(req, param);
                if (type) {
                    broken_param = {
                        name: param.name,
                        type: type
                    };
                }
                return broken_param ? true : false;
            });
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
                parameters: render_parameters(container.parameters),
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
