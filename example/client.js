/*
 * client sample
 */

// import Client class.
var Client = require('hello-work').Client;


// create client instance with 'host' and 'port' options.
var client = new Client({
  host: 'localhost',
  port: 20000,
});


// set 'host' and 'port' with property.
client.host = 'localhost';
client.port = 20000;


// connect to server.
clinet.connect(/* { host: 'localhost', port: 20000, }, */function (err) { // on('connect', function () { ... })

  // error handling
  if (err) {
    // ...
  }

  // general sample.
  var add_task = client.do({ // return task.
    // namespace: '/', // if namespace do not specific, default namespace '/'
    func: 'add', // function name.
    args: { // funciton arguments.
      a: 1,
      b: 2,
    },
  });

  // complete event.
  add_task.on('complete', function (res) {
    console.log('add complete : ' + res);
  });


  // timeout sample.
  var sub_task = lient.do({
    namespace: '/ns1/', // namespace.
    func: 'sub',
    args: {
      a: 2,
      b: 2,
    },
    timeout: 5000,
  });

  // timeout event.
  sub_task.on('timeout', function (code) { // TODO: code : 1 -> network? 2 -> task do not finsh?
    console.log('sub timeout : ', code);
  });

  // complete event.
  sub_task.on('complete', function (res) {
    console.log('sub complete : ' + res);
  });


  // error sample.
  var mul_task = client.do({
    func: 'mul',
    args: {
      a: 2,
      //b: 1,
    }
  });

  // fail event.
  mul_task.on('fail', function (err) {
    console.log('mul fail : ' + err);
  });

  // complete event.
  mul_task.on('complete', function (res) {
    console.log('mul complete : ' + res);
  });


  // binary parameter sample.
  var image_buf = new Buffer(256 * 256); // image data.
  var image_proc_task = client.do({
    func: 'process_image',
    args: {
      image: image_buf,
    }
  });

  // complete event.
  image_proc_task.on('complete', function (res) {
    console.log('process_image : ' + res);
  });

}); // end of client.connect


process.on('exit', function (code, signal) {
  // disconnect from server.
  client.disconnect(function (err) { // on('disconnect', function () { ... });
    // error handling
    if (err) { 
      // ...
    }
    console.log('disconnect');
  });
});

