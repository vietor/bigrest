"use strict";
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

function Inspector(parameters) {

    function inspect(target, parameter) {
        var name = parameter.name;
        var value = target[name];
        if (!value && value !== 0) {
            if (parameter.default || parameter.default === 0)
                target[name] = '' + parameter.default;
            else if (!parameter.empty) {
                if (!parameter.candidate)
                    return PARAM_EMPTY;
                else if (!target[parameter.candidate])
                    return PARAM_EMPTY;
            }
        } else {
            if (parameter.trim) {
                value = value.trim();
                if (!value)
                    return PARAM_EMPTY;
                target[name] = value.trim();
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
                if (value != target[parameter.match])
                    return PARAM_MATCH;
            }
        }
        return PARAM_OK;
    }

    this.parameters = xutil.mapArray(parameters, function(origin) {
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

    this.inspect = function(target) {
        if (this.parameters.length < 1)
            return null;
        else {
            var broken_retval = null;
            xutil.eachBreakArray(this.parameters, function(parameter) {
                var broken_type = inspect(target, parameter);
                if (broken_type) {
                    broken_retval = {
                        name: parameter.name,
                        type: broken_type
                    };
                }
                return broken_retval ? true : false;
            });
            return broken_retval;

        }
    };
}

exports.create = function(parameters) {
    return new Inspector(parameters);
};
