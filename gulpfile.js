'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    cleanCSS = require('gulp-clean-css'),
    sourcemaps = require('gulp-sourcemaps'),
    plumber = require('gulp-plumber');

function handleError(err) {
    console.log('Gulp error', err);
    this.emit('end');
}

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
