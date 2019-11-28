"use strict";

// Load plugins
const autoprefixer = require("autoprefixer");
const browsersync = require("browser-sync").create();
const cp = require("child_process");
const cssnano = require("cssnano");
const del = require("del");
const eslint = require("gulp-eslint");
const haml = require("gulp-haml");
const gulp = require("gulp");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const webpack = require("webpack");
const webpackconfig = require("./webpack.config.js");
const webpackstream = require("webpack-stream");
const fileinclude = require('gulp-file-include');
const gulpCopy = require('gulp-copy');
const ghPages = require('gulp-gh-pages');
const uglify = require('gulp-uglify-es').default;
const concat = require('gulp-concat');
const flattern = require('gulp-flatten');
const sourcemaps = require('gulp-sourcemaps');
const formatHtml = require('gulp-format-html')

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./dist"
    },
    port: 3000
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// CSS task
function css() {
  return gulp
    .src("./src/scss/index.scss")
    //include normalize scss from node module;
    .pipe(sass({includePaths: require('node-normalize-scss').includePaths}))
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write(''))
    .pipe(gulp.dest("./dist"))
    .pipe(browsersync.stream());
}

// Clean assets
function clean() {
  return del(["./dist"]);
}

//partials
function partials () {
  return gulp.src('./src/components/**/*.haml')
    .pipe(haml())
    .pipe(gulp.dest(function(file) {return file.base;}))

}
//haml
function html () {
  return gulp.src('./src/*.haml')
    .pipe(haml())
    .pipe(fileinclude({
        prefix: '@@',
        basepath: '@file'
      }))
      .pipe(formatHtml())
    .pipe(gulp.dest('./dist'));

}
// Lint scripts
function scriptsLint() {
  return gulp
    .src(["./src/js/**/*", "./gulpfile.js"])
    .pipe(plumber())
    .pipe(eslint({ configFile: '.eslintrc'}))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

// Transpile, concatenate and minify scripts
function scripts() {
  return (
    gulp
      .src(["./src/js/**/*", "./src/components/**/*.js"])
      .pipe(flattern())
      //.pipe(concat("index.min.js"))
      //.pipe(uglify())
      .pipe(plumber())
      //.pipe(webpackstream(webpackconfig, webpack))
      // folder only, filename is specified in webpack config
      .pipe(gulp.dest("./dist/js"))
      .pipe(browsersync.stream())
  );
}

//copy
function copy () {
  return gulp.src('./src/assets/**')
    .pipe(gulp.dest('./dist/assets'));
}

function favicons () {
  return gulp.src([
        './src/favicon.png',
        './src/favicon-16x16.png',
        './src/favicon-32x32.png',
        './src/favicon.ico'
      ])
    .pipe(gulp.dest('./dist'));
}

// Deploy
function deploy () {
  return gulp.src('./dist/**/*')
    .pipe(ghPages());
}

// Watch files
function watchFiles() {
  gulp.watch(
    [
      "./src/scss/**/*",
      "./src/components/**/*.scss"
    ],
    gulp.series(css, browserSyncReload)
  );
  gulp.watch(["./src/js/**/*", "./src/components/**/*.js"], gulp.series(scriptsLint, scripts));
  gulp.watch(
    [
      //"./_includes/**/*",
      //"./_layouts/**/*",
      //"./_pages/**/*",
      //"./_posts/**/*",
      "./src/*.haml",
      "./src/components/**/*.haml"
    ],
    gulp.series(partials, html, browserSyncReload)
  );
  //gulp.watch("./assets/img/**/*", images);
}

// define complex tasks

//const build = gulp.series(clean, gulp.parallel(css, images, jekyll, js));
const js = gulp.series(scriptsLint, scripts);
const build = gulp.series(clean, partials, gulp.parallel(html, css, copy, favicons, js));
const watch = gulp.parallel(watchFiles, browserSync);

// export tasks
//exports.images = images;
exports.partials =    partials;
exports.html =        html;
exports.css =         css;
exports.js =          js;
exports.clean =       clean;
exports.concat =      concat;
exports.copy =        copy;
exports.favicons =    favicons;
exports.build =       build;
exports.watch =       watch;
exports.deploy =      deploy;
exports.default =     build;
