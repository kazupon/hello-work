/*
 * worker sample
 */

// import Worker class.
var Worker = require('hello-work').Worker;


// create worker instace.
var worker = new Worker();

// connect to server, with host and port parameter.
worker.connect(/* { host: 'localhost', port: 20000, }, */function (err) { // on('connect', function (err) { ... })

  // error handling
  if (err) {
    // todo ...
    return;
  }

  // general sample.
  var add = function (a, b) {
    return a + b;
  };
  worker.regist({
    // ns: '/', // if namespace do not specific, default namespace is '/'
    func: 'add',
  }, function (job) {
    return add(job.args.a, job.args.b);
  });


  // timeout sample.
  var doHeavySub = function (a, b) {
    // somthing do ...
    return a - b;
  };
  worker.regist({
    namespace: '/ns1/',
    func: 'sub',
  }, function (job) { // detecte timeout by framework
    return doHeavySub(job.args.a, job.args.b);
  });


  // error sample.
  worker.regist({ func: 'mul' }, function (job) {
    if (!job.args.a || !job.args.b) {
      throw new Error('Invalid Parameter');
    }
    return job.args.a + job.args.b; 
  });


  // binary parameter sample.
  var procImage = function (buf) {
    // somthing do.
    // ...
    return new Buffer(256 * 256);
  }
  worker.regist({ func: 'process_image' }, function (job) {
    return procImage(job.args.image);
  });

});


process.on('exit', function (code, signal) {
  // disconnect from server.
  worker.disconnect(function () { // on('disconnect', function () { ... });
    console.log('disconnect');
  });
});

