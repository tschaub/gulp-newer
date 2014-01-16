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

  return gulp.src(imgSrc)
      // only pass through newer images
      .pipe(newer(dest))
      .pipe(imagemin())
      .pipe(gulp.dest(dest));

});


gulp.task('default', function() {

  gulp.watch(imgSrc, function() {
    gulp.run('images');
  });

});
```
