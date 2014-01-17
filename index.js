var Transform = require('stream').Transform;
var fs = require('fs');
var path = require('path');
var util = require('util');

var Q = require('kew');
var gutil = require('gulp-util');

var PluginError = gutil.PluginError;

function Newer(dest) {
  if (typeof dest !== 'string') {
    throw new PluginError('gulp-newer', 'Requires a dest string');
  }
  Transform.call(this, {objectMode: true});

  /** @type {string} */
  this._dest = dest;

  /**
   * Promise for the dest file/directory stats.
   * @type {[type]}
   */
  this._destStats = Q.nfcall(fs.stat, dest);

  /**
   * If the provided dest is a file, we want to pass through all files if any
   * one of the source files is newer than the dest.  To support this, source
   * files need to be buffered until a newer file is found.  When a newer file
   * is found, buffered source files are flushed (and the `_all` flag is set).
   * @type {[type]}
   */
  this._bufferedFiles = null;

  /**
   * Indicates that all files should be passed through.  This is set when the
   * provided dest is a file and we have already encountered a newer source
   * file.  When true, all remaining source files should be passed through.
   * @type {boolean}
   */
  this._all = false;

}
util.inherits(Newer, Transform);


/**
 * Pass through newer files only.
 * @param {File} srcFile A vinyl file.
 * @param {string} encoding Encoding (ignored).
 * @param {function(Error, File)} done Callback.
 */
Newer.prototype._transform = function(srcFile, encoding, done) {
  if (!srcFile || !srcFile.stat) {
    done(new PluginError('gulp-newer', 'Expected a source file with stats'));
    return;
  }
  var self = this;

  this._destStats.then(function(destStats) {
    if (destStats.isDirectory()) {
      // stat dest/relative file
      return Q.nfcall(fs.stat, path.join(self._dest, srcFile.relative));
    } else {
      // wait to see if any are newer, then pass through all
      if (!self._bufferedFiles) {
        self._bufferedFiles = [];
      }
      return Q.resolve(destStats);
    }
  }).fail(function(err) {
    if (err.code === 'ENOENT') {
      // dest file or directory doesn't exist, pass through all
      return Q.resolve(null);
    } else {
      // unexpected error
      return Q.reject(err);
    }
  }).then(function(destFileStats) {
    var newer = !destFileStats || srcFile.stat.mtime > destFileStats.mtime;
    if (self._all) {
      self.push(srcFile);
    } else if (!newer) {
      if (self._bufferedFiles) {
        self._bufferedFiles.push(srcFile);
      }
    } else {
      if (self._bufferedFiles) {
        // flush buffer
        self._bufferedFiles.forEach(function(file) {
          self.push(file);
        });
        self._bufferedFiles.length = 0;
        // pass through all remaining files as well
        self._all = true;
      }
      self.push(srcFile);
    }
    done();
  }, done);

};


/**
 * Remove references to buffered files.
 * @param {function(Error)} done Callback.
 */
Newer.prototype._flush = function(done) {
  this._bufferedFiles = null;
  done();
};


/**
 * Only pass through source files that are newer than the provided destination.
 * @param {string} dest Path to destination directory or file.
 * @return {Newer} A transform stream.
 */
module.exports = function(dest) {
  return new Newer(dest);
};
