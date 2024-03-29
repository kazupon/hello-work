/*
 * worker sample
 */

// import Worker class.
var Worker = require('../lib/hello-work').Worker;


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
  worker.regist({
    // ns: '/', // if namespace do not specific, default namespace is '/'
    func: 'add',
  }, function (job, done) {
    done(job.args.a + job.args.b);
  });

  worker.regist({
    ns: '/ns1/',
    func: 'sub'
  }, function (job, done) {
    done(job.args.a - job.args.b);
  });

  // timeout sample.
  worker.regist({
    ns: '/ns1/',
    func: 'fib',
  }, function (job) { // detect timeout by framework
    var fib = function (n) {
      if (n === 0 || n === 1) {
        return n;
      }
      return fib(n - 1) + fib(n - 2);
    };
    return fib(job.args.n);
  });


  // error sample.
  worker.regist({ func: 'mul' }, function (job, done) {
    if (!job.args.a || !job.args.b) {
      throw new Error('Invalid Parameter');
    }
    done(job.args.a * job.args.b);
  });


  // binary parameter sample.
  var procImage = function (buf) {
    // somthing do.
    // ...
    return new Buffer(256 * 256);
  }
  worker.regist({ func: 'process_image' }, function (job, done) {
    done(procImage(job.args.image));
  });

});

function abort () {
  // disconnect from server.
  worker.disconnect(function () { // on('disconnect', function () { ... });
    console.log('disconnect');
  });
}

var abort_events = ['SIGINT', 'SIGQUIT', 'SIGTERM', 'exit', 'uncaugthException'];
abort_events.forEach(function (event) {
    process.on(event, abort.bind(null));
});

