"use strict";

var gulp = require('gulp');
var prettify = require('gulp-jsbeautifier');
var mocha = require('gulp-mocha');

gulp.task('format-js', function() {
    gulp.src('./index.js')
        .pipe(prettify({
            config: '.jsbeautifyrc',
            mode: 'VERIFY_AND_WRITE'
        }))
        .pipe(gulp.dest('./'));

    gulp.src('./lib/**/*.js')
        .pipe(prettify({
            config: '.jsbeautifyrc',
            mode: 'VERIFY_AND_WRITE'
        }))
        .pipe(gulp.dest('./lib'));

    gulp.src('./test/**/*.js')
        .pipe(prettify({
            config: '.jsbeautifyrc',
            mode: 'VERIFY_AND_WRITE'
        }))
        .pipe(gulp.dest('./test'));

    gulp.src('./demo/**/*.js')
        .pipe(prettify({
            config: '.jsbeautifyrc',
            mode: 'VERIFY_AND_WRITE'
        }))
        .pipe(gulp.dest('./demo'));
});

gulp.task('test', function() {
    gulp.src('./test/*.js')
        .pipe(mocha({
            timeout: 10000,
            bail: true
        }))
        .once('end', function() {
            process.exit();
        });
});

gulp.task('default', ['format-js', 'test']);
