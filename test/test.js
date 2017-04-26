'use strict';

var assert = require('assert');
var bigrest = require('../index');

var http = bigrest.simulator({
    debug: true,
    basepath: __dirname
});


describe('parameter', function() {

    describe('length', function() {
        it('should successed when key length eq contain set', function(done) {
            http.request('GET', '/test/length', {
                key: '12345'
            }, function(status, res) {
                assert.equal(status, 200);
                done();
            });
        });
        it('should failed when key length lt set', function(done) {
            http.request('GET', '/test/length', {
                key: '1'
            }, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
        it('should failed when key length gt set', function(done) {
            http.request('GET', '/test/length', {
                key: '123456'
            }, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
        it('should successed when key length/array eq contain set', function(done) {
            http.request('GET', '/test/length/array', {
                key: '12345'
            }, function(status, res) {
                assert.equal(status, 200);
                done();
            });
        });
        it('should failed when key length/array lt set', function(done) {
            http.request('GET', '/test/length/array', {
                key: '1'
            }, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
        it('should failed when key length/array gt set', function(done) {
            http.request('GET', '/test/length/array', {
                key: '123456'
            }, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
    });

    describe('digit', function() {
        it('should successed when key was digit', function(done) {
            http.request('GET', '/test/digit', {
                key: '-123456.16'
            }, function(status, res) {
                assert.equal(status, 200);
                done();
            });
        });
        it('should failed when key had alphabet', function(done) {
            http.request('GET', '/test/digit', {
                key: '12E13'
            }, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
    });

    describe('values', function() {
        it('should successed when key in values', function(done) {
            http.request('GET', '/test/values', {
                key: '22'
            }, function(status, res) {
                assert.equal(status, 200);
                done();
            });
        });
        it('should failed when key not int values', function(done) {
            http.request('GET', '/test/values', {
                key: '11'
            }, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
    });


    describe('word', function() {
        it('should successed when key was word', function(done) {
            http.request('POST', '/test/word', {
                key: '_abc123ABC'
            }, function(status, res) {
                assert.equal(status, 200);
                done();
            });
        });
        it('should failed when key not word', function(done) {
            http.request('POST', '/test/word', {
                key: '1+a-C'
            }, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
    });

    describe('regexp', function() {
        it('should successed when key was word', function(done) {
            http.request('GET', '/test/regexp', {
                key: '_abc123ABC'
            }, function(status, res) {
                assert.equal(status, 200);
                done();
            });
        });
        it('should failed when key not word', function(done) {
            http.request('GET', '/test/regexp', {
                key: '1+a-C'
            }, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
    });

    describe('range', function() {
        it('should successed when key in range', function(done) {
            http.request('GET', '/test/range', {
                key: '1'
            }, function(status, res) {
                assert.equal(status, 200);
                done();
            });
        });
        it('should failed when key not in range', function(done) {
            http.request('GET', '/test/range', {
                key: '13'
            }, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
        it('should successed when key in range/array', function(done) {
            http.request('GET', '/test/range/array', {
                key: '1'
            }, function(status, res) {
                assert.equal(status, 200);
                done();
            });
        });
        it('should failed when key not in range/array', function(done) {
            http.request('GET', '/test/range/array', {
                key: '13'
            }, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
    });

    describe('match', function() {
        it('should successed when key match', function(done) {
            http.request('GET', '/test/match', {
                key: '1',
                key2: '1'
            }, function(status, res) {
                assert.equal(status, 200);
                done();
            });
        });
        it('should failed when key not match', function(done) {
            http.request('GET', '/test/match', {
                key: '13',
                key2: '14'
            }, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
    });

    describe('default', function() {
        it('should successed when no parameter', function(done) {
            http.request('GET', '/test/default', {
            }, function(status, res) {
                assert.equal(status, 200);
                done();
            });
        });
    });

});

describe('wrong', function() {
    describe('failure', function() {
        it('should successed when empty key', function(done) {
            http.request('GET', '/wrong/failure', {}, function(status, res) {
                assert.equal(status, 400);
                done();
            });
        });
    });

    describe('self-failure', function() {
        it('should successed when self failure', function(done) {
            http.request('GET', '/wrong/failure/self', {}, function(status, res) {
                assert.equal(status, 200);
                assert.equal(res, "key");
                done();
            });
        });
    });

    describe('catch-throw', function() {
        it('should successed when self throw', function(done) {
            http.request('GET', '/wrong/failure/throw', {}, function(status, res) {
                assert.equal(status, 500);
                done();
            });
        });
    });
});
