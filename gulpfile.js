var gulp = require('gulp'),
    webserver = require('gulp-webserver'),
    browserSync = require('browser-sync'),
    historyApiFallback = require('connect-history-api-fallback'),
    reload = browserSync.reload,
    ghPages = require('gulp-gh-pages');



// Watch files for changes & reload
gulp.task('serve', function() {
  browserSync({
    port: 5001,
    notify: false,
    logPrefix: 'PSK',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function(snippet) {
          return snippet;
        }
      }
    },
    server: {
      baseDir: ['.tmp', 'app'],
      middleware: [historyApiFallback()]
    }
  });

  gulp.watch(['app/**/*.html', '!app/bower_components/**/*.html'], reload);
  gulp.watch(['app/scripts/**/*.js'], reload);
  gulp.watch(['app/images/**/*'], reload);
});

// Deploy to GitHub pages gh-pages branch
gulp.task('deploy', function() {
  return gulp.src('app/**/*').pipe(ghPages());
});
