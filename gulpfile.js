var gulp = require('gulp');

var clean = require('gulp-clean');
var concat = require('gulp-concat');
var data = require('gulp-data');
var flatten = require('gulp-flatten');
var gae = require('gulp-gae');
var imagemin = require('gulp-imagemin');
var include = require('gulp-include');
var merge = require('merge-stream');
var minifyCss = require('gulp-minify-css');
var minifyHtml = require('gulp-minify-html');
var nunjucksRender = require('gulp-nunjucks-render');
var path = require('path');
var prettify = require('gulp-html-prettify');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var server = require('gulp-server-livereload');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');


// Delete the entire dist folder
gulp.task('clean', function() {
  return gulp.src('dist/*')
    .pipe(clean());
});

// Render HTML
gulp.task('html', function() {
  return gulp.src('src/*/*.html')
    .pipe(data(function(file) {
      return require(path.dirname(file.path) + '/config.json');
    }))
    .pipe(nunjucksRender({
        path: [
          'src/common/templates'
        ]}))
    .pipe(prettify({indent_char: ' ', indent_size: 2}))
    .pipe(rename(function (path) {
        path.basename = 'index';
      }))
    .pipe(gulp.dest('dist/'));
});

// Move home page to the root directory
gulp.task('home', function() {
  return merge(
    gulp.src('dist/home/*')
      .pipe(gulp.dest('dist')),
    gulp.src('dist/home/*')
      .pipe(clean())
  );
});

// Compile Sass/CSS
gulp.task('styles', function() {
  var sassStream = gulp.src([
    'src/*/*.scss'
  ])
    .pipe(sass().on('error', sass.logError));
  return merge(
    gulp.src([
      'node_modules/normalize.css/normalize.css'
    ]),
    sassStream
  )                  
    .pipe(gulp.dest('dist'));
});

// Build scripts
// TODO: add linting
gulp.task('scripts', function() {
  return gulp.src(['src/*/*.js'])
    .pipe(include({
      extensions: 'js',
      hardFail: true,
      includePaths: [
        __dirname + '/node_modules'
      ]
    }))
    .pipe(gulp.dest('dist'));
});

// Copy images
gulp.task('images', function() {
  return gulp.src(['src/*/images/*'])
    .pipe(imagemin({ progressive: true }))
    .pipe(gulp.dest('dist/img'));
});

// Copy data files
gulp.task('data', function() {
  return gulp.src([
    'src/*/data/*'
  ])
    .pipe(gulp.dest('dist/data'));
});

// Copy misc files
gulp.task('misc', function() {
  return gulp.src([
    'src/robots.txt'
  ])
    .pipe(gulp.dest('dist'));
});

// Build
gulp.task('build', gulp.series('clean', 
  gulp.parallel(
    'html',
    'scripts',
    'styles',
    'images',
    'data',
    'misc'
  ),
  'home'));

gulp.task('server', function() {
  gulp.src('dist')
    .pipe(server({
      livereload: true,
      directoryListing: false,
      open: true
    }));
});

// Watch
gulp.task('watch', function() {
  gulp.watch('src/*/*.js', gulp.series('scripts', 'home'));
  gulp.watch('src/*/*.scss', gulp.series('styles', 'home'));
  gulp.watch(['src/common/templates/*', 'src/*/*.html'], gulp.series('html', 'home'));
  gulp.watch('src/*/images/*', gulp.series('images'));  
  gulp.watch('src/*/data/*', gulp.series('data'));
});

gulp.task('serve', gulp.series('build', 'server', 'watch'));
gulp.task('default', gulp.series('serve'));
