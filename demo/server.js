'use strict';

var path = require('path');
var bigrest = require('../index');

var http = bigrest.listen(18080, {
    basepath: __dirname,
    static: {
        urlpath: '/files',
        filepath: path.join(__dirname, 'files')
    }
});
