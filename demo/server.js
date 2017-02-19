'use strict';

var path = require('path');
var bigrest = require('../index');

var http = bigrest.listen(18080, {
    debug: true,
    basepath: __dirname,
    static: {
        urlpath: '/files',
        filepath: path.join(__dirname, 'files')
    },
    compression: {
        threshold: 16 * 1024
    },
    rootwork: function(req, res) {
        res.send('It works...');
    },
    r404work: function(req, res, next) {
        if(req.path !== '/404')
            next();
        else
            res.redirect('/');
    },
    cookieSession: {
        secret: 'demo'
    }
});
