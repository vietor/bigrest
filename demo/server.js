'use strict';

var bigrest = require('../index');

var http = bigrest.listen(8080, {
    basepath: __dirname
});
