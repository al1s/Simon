/* jshint esversion: 6 */
/* jshint node: true */

'use strict';

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const del = require('del');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
// const gulpIf = require('gulp-if');
const size = require('gulp-size');
const cleanss = require('gulp-cleancss');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const gulpSequence = require('gulp-sequence');
const newer = require('gulp-newer');
const image = require('gulp-image');
const postcss = require('gulp-postcss');
// const uncss = require('postcss-uncss');

const dirs = {
  srcPath: './src/',
  buildPath: './build/'
};

const copiedJs = [
  './node_modules/whatwg-fetch/fetch.js',
  './node_modules/es6-promise/dist/es6-promise.auto.js'
];

const postCssPlugins = [
  autoprefixer({ browsers: ['last 2 version', 'Safari >= 8'] })//,
  // uncss({ html: [`${dirs.srcPath}/*.html`] })
  // mqpacker({
  //   sort: true
  // }),
  // atImport(),
  // inlineSVG()
];

gulp.task('clean', () => {
  console.log('---------- Очистка папки сборки');
  return del([
    `${dirs.buildPath}/**/*`,
    `!${dirs.buildPath}/readme.md`
  ]);
});

gulp.task('style', () => {
  const sourcemaps = require('gulp-sourcemaps');
  const wait = require('gulp-wait');
  console.log(dirs.srcPath + '/style.css');
  return gulp.src(dirs.srcPath + '/style.css')
    .pipe(plumber({
      errorHandler: (err) => {
        notify.onError({
          title: 'Single style compilation error',
          message: err.message
        })(err);
        this.emit('end');
      }
    }))
    .pipe(wait(100))
    .pipe(sourcemaps.init())
    .pipe(postcss(postCssPlugins))
    .pipe(cleanss())
    .pipe(sourcemaps.write('/'))
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest(dirs.buildPath + '/css'))
    .pipe(browserSync.stream({ match: '**/*.css' }));
});

gulp.task('html', () => {
  return gulp.src(dirs.srcPath + '/*.html')
    .pipe(plumber({
      errorHandler: (err) => {
        notify.onError({
          title: 'HTML compilation error',
          message: err.message
        })(err);
        this.emit('end');
      }
    }))
    .pipe(gulp.dest(dirs.buildPath));
});

gulp.task('js',  () => {
  const uglify = require('gulp-uglify');
  const concat = require('gulp-concat');
  return gulp.src(dirs.srcPath + '/*.js')
    .pipe(sourcemaps.init())
    .pipe(plumber({
      errorHandler: (err) => {
        notify.onError({
          title: 'Javascript concat/uglify error',
          message: err.message
        })(err);
        this.emit('end');
      }
    }))
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest(dirs.buildPath + '/js'));
});

gulp.task('copy:js', (callback) => {
  if (copiedJs.length) {
    return gulp.src(copiedJs)
      .pipe(size({
        title: 'Размер',
        showFiles: true,
        showTotal: false,
      }))
      .pipe(gulp.dest(dirs.buildPath + '/js'));
  } else callback();
});

gulp.task('img:opt',  (callback) => {
  const imagemin = require('gulp-imagemin');
  return gulp.src(dirs.srcPath + '/img/*.{jpg,jpeg,gif,png,svg}')
    .pipe(image({
      jpegRecompress: false//,
    }))
    .pipe(gulp.dest(dirs.buildPath));
});

gulp.task('copy:img', () => {
  return gulp.src(dirs.srcPath + '/img' + '/*.{jpg,jpeg,gif,png,svg}')
    .pipe(newer(dirs.buildPath + '/img'))  // оставить в потоке только изменившиеся файлы
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest(dirs.buildPath + '/img'));
});

gulp.task('build', (callback) => {
  gulpSequence(
    'clean',
    ['style', 'js', 'copy:js', 'copy:img'],
    'html',
    callback
  );
});

// Отправка в GH pages (ветку gh-pages репозитория)
gulp.task('deploy', () => {
  const ghPages = require('gulp-gh-pages');
  console.log('---------- Публикация содержимого ./build/ на GH pages');
  return gulp.src(dirs.buildPath + '**/*')
    .pipe(ghPages());
});

// Задача по умолчанию
gulp.task('default', ['serve']);

gulp.task('serve', ['build'], () => {
  browserSync.init({
    server: dirs.buildPath,
    startPath: 'index.html',
    open: false,
    port: 8080,
  });
  // Слежение за стилями
  gulp.watch(dirs.srcPath + '/*.css', ['watch:style']);
  // Слежение за добавочными JS
  if (copiedJs.length) {
    gulp.watch(copiedJs, ['watch:copy:js']);
  }
  // Слежение за html
  gulp.watch([
    '*.html',
    dirs.blocksDirName + '/**/*.html'
  ], { cwd: dirs.srcPath }, ['watch:html']);
  // Слежение за JS
  gulp.watch(dirs.srcPath + '/*.js', ['watch:js']);
});

function reload(done) {
  browserSync.reload();
  done();
}

// Браузерсинк с 3-м галпом — такой браузерсинк...
gulp.task('watch:img', ['copy:img'], reload);
gulp.task('watch:copied:js', ['copy:js'], reload);
gulp.task('watch:html', ['html'], reload);
gulp.task('watch:js', ['js'], reload);
gulp.task('watch:style', ['style'], reload);
