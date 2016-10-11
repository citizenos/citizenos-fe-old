'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    path = require('path'),
    concat  = require('gulp-concat'),
    cleanCSS = require('gulp-clean-css'),
    sourcemaps = require('gulp-sourcemaps'),
    plumber = require('gulp-plumber'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    watch = require('gulp-watch'),
    batch = require('gulp-batch'),
    runSequence = require('run-sequence').use(gulp),
    exec = require('child_process').exec,
    pump = require('pump'),
    mustache = require('gulp-mustache'),
    foreach = require('gulp-foreach'),
    uncache = require('gulp-uncache'),
    fs = require('fs');

 var pkg = JSON.parse(fs.readFileSync('package.json'));

function handleError(err) {
    console.log('Gulp error', err);
    this.emit('end');
}

gulp.task('concurrent-dev', function(callback) {
    runSequence('exec-start',
                'uglify',
                'sass',
                'cachebreaker',
                'watch',
                  callback);
});

gulp.task('exec-start', function () {
    exec('npm start', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        handleError(err);
    });
});

gulp.task('exec-test', function () {
    exec('npm test', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        handleError(err);
    });
});

gulp.task('exec-start_ep', function () {
    exec('npm sh _submodules/etherpad/bin/run.sh', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        handleError(err);
    });
});

gulp.task('jshint', function (){
    return gulp.src(['public/js/**/*.js',
                     '!public/js/lib/**/*.js'
                   ])
    	           .pipe(jshint())
                   .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('uglify', function () {
    return gulp.src([
                     'public/js/libs/ext/device.min.js',
                     'public/js/libs/ext/jquery-1.11.1.min.js',
                     'public/js/libs/ext/jquery.functions.js',
                     'public/js/libs/moment-with-locales.js',
                     'public/js/libs/hwcrypto-legacy.js',
                     'public/js/libs/hwcrypto.js',
                     'public/js/libs/angular.js',
                     'public/js/libs/angular/angular-sanitize.js',
                     'public/js/libs/angular/angular-ui-router.js',
                     'public/js/libs/angular/angular-translate.js',
                     'public/js/libs/angular/angular-translate-loader-static-files.js',
                     'public/js/libs/angular/angular-moment.js',
                     'public/js/libs/angular/ngKookies.js',
                     'public/js/libs/angular/angular-translate-storage-kookies.js',
                     'public/js/libs/**/*.js',
                     'public/js/app.js',
                     'public/js/services/**/*.js',
                     'public/js/controllers/**/*.js'
                ])
                .pipe(plumber())
                .pipe(sourcemaps.init())
                .pipe(concat(pkg.name+'.bundle.js'))
                .on('error', function (err) {
                    handleError(err);
                })
                .pipe(uglify({
                    mangle: false,
                    compress: false,
                    beautify: true,
                    preserveComments: 'all',
                    sourceMap: true,
                    sourceMapName: pkg.name+'.bundle.js.map'
                }))
                .pipe(sourcemaps.write('.', {
                    includeContent: false}))
                .on('error', function (err) {
                    handleError(err);
                })
                .pipe(gulp.dest('public/js/'));
});

gulp.task('cachebreaker', function() {
    return gulp.src('public/views/index.html')
    .pipe(uncache())
    .pipe(gulp.dest('public'));
});

gulp.task('watch',['uglify', 'sass', 'cachebreaker'], function () {
   watch(['public/js/**/*.js', '!public/js/<%= pkg.name %>.bundle.js'], batch(function (events, done) {
        gulp.start('uglify', function (){
            gulp.start('cachebreaker')
       });
   }));

   gulp.watch('public/styles/*.scss', ['sass']).on('error', handleError);
});

gulp.task('sass', function () {
    gulp.src('public/styles/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(cleanCSS())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('public/styles/'))
});

gulp.task('default', ['sass'], function () {
    gulp.watch('public/styles/*/*.scss', ['sass']).on('error', handleError);
    gulp.watch('public/styles/*.scss', ['sass']).on('error', handleError);
});

gulp.task('start', function () {
    gulp.start('concurrent-dev');
});

gulp.task('test', function () {
    gulp.start(['exec-test']);
});
