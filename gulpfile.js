'use strict';

var gulp = require('gulp');
var electron = require('electron-connect').server.create();

gulp.task('serve', function () {

  // Start browser process
  electron.start();

  // Reload process process
  gulp.watch(['app/**/*.js', 'app/**/*.html', 'app/**/*.css'], electron.restart);
});