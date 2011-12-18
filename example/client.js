/*
 * client sample
 */

// import Client class.
var Client = require('../lib/hello-work').Client;


// create client instance.
var client = new Client();


// connect to server, with port and host parameter.
client.connect(/* { host: 'localhost', port: 20000, }, */function (err) { // on('connect', function (err) { ... })

  // error handling
  if (err) {
    // todo ...
    return;
  }

  // general sample.
  client.do({ // return task.
    // ns: '/', // if namespace do not specific, default namespace '/'
    func: 'add', // function name.
    args: { // funciton arguments.
      a: 1,
      b: 2
    },
  }, function (job) {
    // complete event.
    job.on('complete', function (res) {
      console.log('add complete : %j', res);
    });
  });


  // timeout sample.
  client.do({
    ns: '/ns1/', // namespace.
    func: 'sub',
    args: {
      a: 2,
      b: 2
    },
    timeout: 5000,
  }, function (job) {
    // timeout event.
    //job.on('timeout', function (code) { // TODO: code : 1 -> network? 2 -> task do not finsh?
    //  console.log('sub timeout : ', code);
    //});
    // complete event.
    job.on('complete', function (res) {
      console.log('sub complete : %j', res);
    });
  });


  // error sample.
  client.do({
    func: 'mul',
    args: {
      a: 2,
      b: 1
    }
  }, function (job) {
    // fail event.
    job.on('fail', function (err) {
      console.log('mul fail : ' + err);
    });
    // complete event.
    job.on('complete', function (res) {
      console.log('mul complete : %j', res);
    });
  });


  /*
  // binary parameter sample.
  var image_buf = new Buffer(256 * 256); // image data.
  client.do({
    func: 'process_image',
    args: {
      image: image_buf,
    }
  }, function (job) {
    // complete event.
    job.on('complete', function (res) {
      console.log('process_image : ' + res);
    });
  });
  */

}); // end of client.connect

function abort () {
  // disconnect from server.
  client.disconnect(function (err) { // on('disconnect', function () { ... });
    // error handling
    if (err) { 
      // todo ...
      return;
    }
    console.log('disconnect');
  });
}

var abort_events = ['SIGINT', 'SIGQUIT', 'SIGTERM', 'exit', 'uncaugthException'];
abort_events.forEach(function (event) {
  process.on(event, abort.bind(null));
});

