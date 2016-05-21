var Transform = require('stream').Transform;
var expect = require('code').expect;
var fs = require('fs');
var gutil = require('gulp-util');
var lab = exports.lab = require('lab').script();
var mock = require('mock-fs');
var newer = require('./index.js');
var path = require('path');

var File = gutil.File;
var PluginError = gutil.PluginError;

/**
 * Test utility function.  Create File instances for each of the provided paths
 * and write to the provided stream.  Call stream.end() when done.
 * @param {stream.Transform} stream Transform stream.
 * @param {Array.<string>} paths Array of file paths.
 */
function write(stream, paths) {
  paths.forEach(function(filePath) {
    stream.write(new File({
      contents: fs.readFileSync(filePath),
      path: path.resolve(filePath),
      stat: fs.statSync(filePath)
    }));
  });
  stream.end();
}

lab.experiment('newer()', function() {

  lab.test('creates a transform stream', function(done) {
    var stream = newer('foo');
    expect(stream).to.be.an.instanceof(Transform);
    done();
  });

  lab.test('requires a string dest or an object with the dest property', function(done) {

    expect(function() {
      newer();
    }).to.throw(PluginError, 'Requires a dest string or options object');

    expect(function() {
      newer(123);
    }).to.throw(PluginError, 'Requires either options.dest or options.map or both');

    expect(function() {
      newer({});
    }).to.throw(PluginError, 'Requires either options.dest or options.map or both');

    done();
  });

  lab.experiment('config.ext', function() {

    lab.test('must be a string', function(done) {

      expect(function() {
        newer({dest: 'foo', ext: 1});
      }).to.throw(PluginError, 'Requires ext to be a string');

      expect(function() {
        newer({dest: 'foo', ext: {}});
      }).to.throw(PluginError, 'Requires ext to be a string');

      done();
    });
  });

  lab.experiment('config.map', function() {

    lab.test('must be a function', function(done) {
      expect(function() {
        newer({dest: 'foo', map: 1});
      }).to.throw(PluginError, 'Requires map to be a function');

      expect(function() {
        newer({dest: 'foo', map: 'bar'});
      }).to.throw(PluginError, 'Requires map to be a function');

      done();
    });

    lab.test('makes the dest config optional', function(done) {
      expect(function() {
        newer({map: function() {}});
      }).not.to.throw();

      done();
    });

  });

  lab.experiment('dest dir that does not exist', function() {

    lab.beforeEach(function(done) {
      mock({
        source1: 'source1 content',
        source2: 'source2 content',
        source3: 'source3 content'
      });

      done();
    });

    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through all files', function(done) {
      var stream = newer('new/dir');

      var paths = ['source1', 'source2', 'source3'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).to.equal(path.resolve(paths[calls]));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(paths.length);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('dest file that does not exist', function() {

    lab.beforeEach(function(done) {
      mock({
        file1: 'file1 content',
        file2: 'file2 content',
        file3: 'file3 content',
        dest: {}
      });
      done();
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through all files', function(done) {
      var stream = newer('dest/concat');

      var paths = ['file1', 'file2', 'file3'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).to.equal(path.resolve(paths[calls]));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(paths.length);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('empty dest dir', function() {

    lab.beforeEach(function(done) {
      mock({
        source1: 'source1 content',
        source2: 'source2 content',
        source3: 'source3 content',
        dest: {}
      });
      done();
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through all files', function(done) {
      var stream = newer('dest');

      var paths = ['source1', 'source2', 'source3'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).to.equal(path.resolve(paths[calls]));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(paths.length);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('dest dir with one older file', function() {

    lab.beforeEach(function(done) {
      mock({
        file1: 'file1 content',
        file2: 'file2 content',
        file3: 'file3 content',
        dest: {
          file2: mock.file({
            content: 'file2 content',
            mtime: new Date(1)
          })
        }
      });
      done();
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through all files', function(done) {
      var stream = newer('dest');

      var paths = ['file1', 'file2', 'file3'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).to.equal(path.resolve(paths[calls]));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(paths.length);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('dest dir with one newer file', function() {

    lab.beforeEach(function(done) {
      mock({
        file1: mock.file({
          content: 'file1 content',
          mtime: new Date(100)
        }),
        file2: mock.file({
          content: 'file2 content',
          mtime: new Date(100)
        }),
        file3: mock.file({
          content: 'file3 content',
          mtime: new Date(100)
        }),
        dest: {
          file2: mock.file({
            content: 'file2 content',
            mtime: new Date(200)
          })
        }
      });
      done();
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through two newer files', function(done) {
      var stream = newer('dest');

      var paths = ['file1', 'file2', 'file3'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).not.to.equal(path.resolve('file2'));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(paths.length - 1);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('dest dir with two newer and one older file', function() {

    lab.beforeEach(function(done) {
      mock({
        file1: mock.file({
          content: 'file1 content',
          mtime: new Date(100)
        }),
        file2: mock.file({
          content: 'file2 content',
          mtime: new Date(100)
        }),
        file3: mock.file({
          content: 'file3 content',
          mtime: new Date(100)
        }),
        dest: {
          file1: mock.file({
            content: 'file1 content',
            mtime: new Date(150)
          }),
          file2: mock.file({
            content: 'file2 content',
            mtime: new Date(50)
          }),
          file3: mock.file({
            content: 'file3 content',
            mtime: new Date(150)
          })
        }
      });
      done();
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through one newer file', function(done) {
      var stream = newer('dest');

      var paths = ['file1', 'file2', 'file3'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).to.equal(path.resolve('file2'));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(1);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('dest file with first source file newer', function() {

    lab.beforeEach(function(done) {
      mock({
        file1: mock.file({
          content: 'file1 content',
          mtime: new Date(200)
        }),
        file2: mock.file({
          content: 'file2 content',
          mtime: new Date(100)
        }),
        file3: mock.file({
          content: 'file3 content',
          mtime: new Date(100)
        }),
        dest: {
          output: mock.file({
            content: 'file2 content',
            mtime: new Date(150)
          })
        }
      });
      done();
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through all source files', function(done) {
      var stream = newer('dest/output');

      var paths = ['file1', 'file2', 'file3'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).to.equal(path.resolve(paths[calls]));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(paths.length);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('dest file with second source file newer', function() {

    lab.beforeEach(function(done) {
      mock({
        file1: mock.file({
          content: 'file1 content',
          mtime: new Date(100)
        }),
        file2: mock.file({
          content: 'file2 content',
          mtime: new Date(200)
        }),
        file3: mock.file({
          content: 'file3 content',
          mtime: new Date(100)
        }),
        dest: {
          output: mock.file({
            content: 'file2 content',
            mtime: new Date(150)
          })
        }
      });
      done();
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through all source files', function(done) {
      var stream = newer('dest/output');

      var paths = ['file1', 'file2', 'file3'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).to.equal(path.resolve(paths[calls]));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(paths.length);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('dest file with last source file newer', function() {

    lab.beforeEach(function(done) {
      mock({
        file1: mock.file({
          content: 'file1 content',
          mtime: new Date(100)
        }),
        file2: mock.file({
          content: 'file2 content',
          mtime: new Date(100)
        }),
        file3: mock.file({
          content: 'file3 content',
          mtime: new Date(200)
        }),
        dest: {
          output: mock.file({
            content: 'file2 content',
            mtime: new Date(150)
          })
        }
      });
      done();
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through all source files', function(done) {
      var stream = newer('dest/output');

      var paths = ['file1', 'file2', 'file3'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).to.equal(path.resolve(paths[calls]));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(paths.length);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('dest file with no newer source files', function() {

    lab.beforeEach(function(done) {
      mock({
        file1: mock.file({
          content: 'file1 content',
          mtime: new Date(100)
        }),
        file2: mock.file({
          content: 'file2 content',
          mtime: new Date(100)
        }),
        file3: mock.file({
          content: 'file3 content',
          mtime: new Date(100)
        }),
        dest: {
          output: mock.file({
            content: 'file2 content',
            mtime: new Date(150)
          })
        }
      });
      done()
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through no source files', function(done) {
      var stream = newer('dest/output');

      var paths = ['file1', 'file2', 'file3'];

      var calls = 0;
      stream.on('data', function(file) {
        done(new Error('Expected no source files'));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(0);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('dest file ext and two files', function() {

    lab.beforeEach(function(done) {
      mock({
        'file1.ext1': mock.file({
          content: 'file1 content',
          mtime: new Date(100)
        }),
        'file2.ext1': mock.file({
          content: 'file2 content',
          mtime: new Date(100)
        }),
        dest: {
          'file1.ext2': mock.file({
            content: 'file1 content',
            mtime: new Date(100)
          }),
          'file2.ext2': mock.file({
            content: 'file2 content',
            mtime: new Date(50)
          })
        }
      });
      done();
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through one newer file', function(done) {
      var stream = newer({dest: 'dest', ext: '.ext2'});

      var paths = ['file1.ext1', 'file2.ext1'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).to.equal(path.resolve('file2.ext1'));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(1);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('custom mapping between source and dest', function() {

    lab.beforeEach(function(done) {
      mock({
        'file1.ext1': mock.file({
          content: 'file1 content',
          mtime: new Date(100)
        }),
        'file2.ext1': mock.file({
          content: 'file2 content',
          mtime: new Date(100)
        }),
        dest: {
          'file1.ext2': mock.file({
            content: 'file1 content',
            mtime: new Date(100)
          }),
          'file2.ext2': mock.file({
            content: 'file2 content',
            mtime: new Date(50)
          })
        }
      });
      done();
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('passes through one newer file', function(done) {
      var stream = newer({
        dest: 'dest',
        map: function(destPath) {
          return destPath.replace('.ext1', '.ext2');
        }
      });

      var paths = ['file1.ext1', 'file2.ext1'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).to.equal(path.resolve('file2.ext1'));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(1);
        done();
      });

      write(stream, paths);
    });

    lab.test('allows people to join to dest themselves', function(done) {
      var stream = newer({
        map: function(destPath) {
          return path.join('dest', destPath.replace('.ext1', '.ext2'));
        }
      });

      var paths = ['file1.ext1', 'file2.ext1'];

      var calls = 0;
      stream.on('data', function(file) {
        expect(file.path).to.equal(path.resolve('file2.ext1'));
        ++calls;
      });

      stream.on('error', done);

      stream.on('end', function() {
        expect(calls).to.equal(1);
        done();
      });

      write(stream, paths);
    });

  });

  lab.experiment('reports errors', function() {
    lab.beforeEach(function(done) {
      mock({
        'q': mock.file({
          mtime: new Date(100)
        }),
        dest: {}
      });
      done();
    });
    lab.afterEach(function(done) {
      mock.restore();
      done();
    });

    lab.test('in "data" handlers', function(done) {
      var stream = newer('dest');

      var err = new Error('test');

      stream.on('data', function() {
        throw err;
      });

      stream.on('error', function(caught) {
        expect(caught).to.equal(err);
        done();
      });

      write(stream, ['q']);
    });

  });

});
