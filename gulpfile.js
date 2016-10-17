'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    path = require('path'),
    concat = require('gulp-concat'),
    cleanCSS = require('gulp-clean-css'),
    sourcemaps = require('gulp-sourcemaps'),
    plumber = require('gulp-plumber'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    watch = require('gulp-watch'),
    batch = require('gulp-batch'),
    runSequence = require('run-sequence').use(gulp),
    uncache = require('gulp-uncache'),
    replace = require('gulp-replace'),
    cachebust = require('gulp-cache-bust'),
    fs = require('fs');

var pkg = JSON.parse(fs.readFileSync('package.json'));

gulp.task('default', function () {
    runSequence(
        'uglify',
        'sass',
        'cachebreaker',
        'watch'
    );
});

gulp.task('jshint', function () {
    return gulp.src([
            'public/js/**/*.js',
            '!public/js/libs/**/*.js',
            '!public/js/*.bundle.js'
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('uglify', function () {
    return gulp.src([
            'public/js/libs/angular.js',
            'public/js/libs/**/*.js',
            'public/js/app.js',
            'public/js/services/**/*.js',
            'public/js/controllers/**/*.js'
        ])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(concat(pkg.name + '.bundle.js'))
        .pipe(uglify({
            mangle: false,
            compress: false,
            beautify: true,
            preserveComments: 'all',
            sourceMap: true,
            sourceMapName: pkg.name + '.bundle.js.map'
        }))
        .pipe(sourcemaps.write('.', {
            includeContent: false
        }))
        .pipe(gulp.dest('public/js/'));
});

gulp.task('cachebreaker', function () {
    return gulp.src('public/index.html')
    .pipe(cachebust({
        type: 'MD5'
    }))
    .pipe(gulp.dest('public/'));
});

gulp.task('watch', function () {
    gulp.watch(['public/js/**/*.js', '!public/js/*.bundle.js'], function () {
        runSequence(
            'uglify',
            'cachebreaker'
        );
    });
    gulp.watch('public/styles/*.scss', function () {
        runSequence(
            'sass',
            'cachebreaker'
        );
    });
});

gulp.task('sass', function () {
    gulp.src('public/styles/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(cleanCSS())
        .pipe(concat(pkg.name + '.bundle.css'))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('public/styles/'))
});
