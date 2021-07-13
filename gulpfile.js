'use strict';

const {Gulp, series, watch} = require('gulp'),
    gulp = new Gulp(),
    sass = require('gulp-sass')(require('sass')),
    concat = require('gulp-concat'),
    cleanCSS = require('gulp-clean-css'),
    sourcemaps = require('gulp-sourcemaps'),
    plumber = require('gulp-plumber'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    uglify = require('gulp-uglify'),
    pipeline = require('readable-stream').pipeline,
    cachebust = require('gulp-cache-bust'),
    fs = require('fs');

var pkg = JSON.parse(fs.readFileSync('package.json'));

const jshintTask = function () {
    return pipeline(
        gulp.src([
            'public/js/**/*.js',
            '!public/js/libs/**/*.js',
            '!public/js/*.bundle.js'
        ]),
        jshint(),
        jshint.reporter(stylish)
    );
};

var uglifyTask =  function() {
    return pipeline(
        gulp.src([
            'public/js/libs/easymde.min.js',
            'public/js/libs/marked.min.js',
            'public/js/libs/OneDrive.js',
            'public/js/libs/moment-with-locales.js',
            'public/js/libs/hwcrypto-legacy.js',
            'public/js/libs/hwcrypto.js',
            'public/js/libs/angular.js',
            'public/js/libs/angular-touch.js',
            'public/js/libs/angular-resource.js',
            'public/js/libs/angular-ui-router.js',
            'public/js/libs/angular-translate.js',
            'public/js/libs/angular-raven.js',
            'public/js/libs/**/*.js',
            'public/js/app.js',
            'public/js/factories/**/*.js',
            'public/js/services/**/*.js',
            'public/js/filters/**/*.js',
            'public/js/directives/**/*.js',
            'public/js/controllers/**/*.js'
        ], {allowEmpty: true}),
        sourcemaps.init({loadMaps: true}),
        plumber(),
        uglify({
            mangle: false,
            compress: false
        }),
        concat(pkg.name + '.bundle.js'),
        sourcemaps.write('.'),
        gulp.dest('public/js/')
    );
};

var cachebreaker = function() {
    return pipeline(
        gulp.src('public/index.html'),
        cachebust({
            type: 'MD5',
            showLog: true
        }),
        gulp.dest('public/')
    );
};

var watchTask = function() {
        watch(['public/js/**/*.js', '!public/js/*.bundle.js', '!public/js/widgets.arguments.js'], series(
                uglifyTask,
                cachebreaker
            )
        ),
        watch('public/styles/**/*.scss',series(
            sassTask,
            sass_etherpad,
            sass_widgets,
            cachebreaker
            )
        )
};

/**
 * TODO: Would be 1 SASS task if followed the best practice - http://thesassway.com/beginner/how-to-structure-a-sass-project
 * BUT, if we try to follow it with current code, SASS goes berserk and generates 31 mb CSS or hangs. Needs some investigation.
 */
var sassTask = function() {
    return pipeline(
        gulp.src(['public/styles/easymde.min.css', 'public/styles/*.scss', '!public/styles/_vars.scss', '!public/styles/_mixins_n_extends.scss']),
        plumber(),
        sourcemaps.init(),
        sass(),
        cleanCSS(),
        concat(pkg.name + '.bundle.css'),
        sourcemaps.write('maps'),
        gulp.dest('public/styles/')
    );
};

var sass_etherpad =  function() {
    return pipeline(
        gulp.src(['public/styles/etherpad/etherpad.scss']),
        plumber(),
        sourcemaps.init(),
        sass(),
        cleanCSS(),
        sourcemaps.write('maps'),
        gulp.dest('public/styles/')
    );
};

var sass_widgets = function() {
    return pipeline(
        gulp.src(['public/styles/widgets/widgets.scss']),
        plumber(),
        sourcemaps.init(),
        sass(),
        cleanCSS(),
        sourcemaps.write('maps'),
        gulp.dest('public/styles/')
    );
};

exports.jshint = jshintTask;
exports.uglify =  uglifyTask;
exports.cachebreaker = cachebreaker;
exports.watch = watchTask;
exports.sass = sassTask;
exports.sass_etherpad = sass_etherpad;
exports.sass_widgets = sass_widgets;

exports.default = series(
    uglifyTask,
    sassTask,
    sass_etherpad,
    sass_widgets,
    cachebreaker,
    watchTask
);