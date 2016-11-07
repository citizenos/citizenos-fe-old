'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    path = require('path'),
    concat = require('gulp-concat'),
    cleanCSS = require('gulp-clean-css'),
    sourcemaps = require('gulp-sourcemaps'),
    plumber = require('gulp-plumber'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    uglify = require('gulp-uglify'),
    watch = require('gulp-watch'),
    batch = require('gulp-batch'),
    runSequence = require('run-sequence').use(gulp),
    uncache = require('gulp-uncache'),
    cachebust = require('gulp-cache-bust'),
    fs = require('fs'),
    templateCache = require('gulp-angular-templatecache');

var pkg = JSON.parse(fs.readFileSync('package.json'));

gulp.task('templatecache', function () {
  return gulp.src('public/views/**/*.html')
    .pipe(templateCache({
        templateHeader: 'angular.module(\'view-template-cache\'<%= standalone %>)\n    .run([\'$templateCache\', function($templateCache) {\n',
        templateBody: '        $templateCache.put(\'<%= url %>\',\'<%= contents %>\');',
        templateFooter: '\n    }]);',
        standalone :true
    }))
    .pipe(concat('template-cache.js'))
    .pipe(gulp.dest('public/js/libs'));
});

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
        .pipe(jshint.reporter(stylish));
});

gulp.task('uglify', function () {
    return gulp.src([
            'public/js/libs/moment-with-locales.js',
            'public/js/libs/angular.js',
            'public/js/libs/angular-touch.js',
            'public/js/libs/angular-route.js',
            'public/js/libs/angular-translate.js',
            'public/js/libs/**/*.js',
            'public/js/app.js',
            'public/js/services/**/*.js',
            'public/js/filters/**/*.js',
            'public/js/directives/**/*.js',
            'public/js/controllers/**/*.js'
        ])
        .pipe(sourcemaps.init({loadMaps : true}))
        .pipe(plumber())
        .pipe(uglify({
            mangle: false,
            compress: false,
            beautify: true
        }))
        .pipe(concat(pkg.name + '.bundle.js'))
        .pipe(sourcemaps.write('.'))
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
    gulp.watch('public/views/**/*.html', function () {
        runSequence(
            'templatecache'
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
