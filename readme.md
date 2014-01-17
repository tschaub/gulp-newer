# `gulp-newer`

A gulp plugin for passing through only those source files that are newer than corresponding destination files.

## Install

```
npm install gulp-newer --save-dev
```

## Use

```js
var gulp = require('gulp');
var newer = require('gulp-newer');
var imagemin = require('gulp-imagemin');

var imgSrc = 'src/img/**';
var imgDest = 'build/img';

// Minify any new images
gulp.task('images', function() {

  // Add the newer pipe to pass through newer images only
  return gulp.src(imgSrc)
      .pipe(newer(imgDest))
      .pipe(imagemin())
      .pipe(gulp.dest(imgDest));

});


gulp.task('default', function() {

  gulp.watch(imgSrc, function() {
    gulp.run('images');
  });

});
```

[![Current Status](https://secure.travis-ci.org/tschaub/gulp-newer.png?branch=master)](https://travis-ci.org/tschaub/gulp-newer)
