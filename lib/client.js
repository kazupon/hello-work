/**
 * client.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var net = require('net');

//
// constant(s)
//
var REGEX_HOSTNAME = /^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$/;
var REGEX_IPADDRESS = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;


//
// clsss(es)
//

function Client () {
  EventEmitter.call(this);
}

util.inherits(Client, EventEmitter);


/**
 * Connect to hellowork server.
 * @method connect
 * @param {Object} [options] an option parameters.
 * @param {Number} [options.port] a port number.
 * @param {String} [options.hsot] a hostname.
 * @param {Function} [callback] a callback function. 
 */
Client.prototype.connect = function (/*options, callback*/) {

  var self = this;

  var options;
  var callback;
  if (typeof arguments[0] === 'object') {
    options = arguments[0];
    callback = arguments[1];
  } else {
    callback = arguments[0];
  }

  if (this.socket) {
    var err = new Error('AlreadyConnect');
    if (callback) {
      callback(err);
    } else {
      this.emit('connect', err);
    }
    return;
  }

  var port = 20000;
  if (options && (options.port !== undefined)) {
    port = options.port;
  }
  if (port <= 1024 || port >= 65536) {
    var err = new Error('InvalidParameter');
    if (callback) {
      callback(err);
    } else {
      this.emit('connect', err);
    }
    return;
  }

  var host = 'localhost';
  if (options && (options.host !== undefined)) {
    host = options.host;
  }
  if ((!REGEX_HOSTNAME.test(host) & !REGEX_IPADDRESS.test(host))) {
    var err = new Error('InvalidParameter');
    if (callback) {
      callback(err);
    } else {
      this.emit('connect', err);
    }
    return;
  }

  var socket = new net.Socket({
    allowHalfOpen: true
  });
  socket.on('error', function (err) {
    if (self.socket) { // connected
      self.emit('error', err);
    } else { // close
      if (callback) {
        callback(err);
      } else {
        self.emit('connect', err);
      }
    }
  });

  socket.connect(port, host, function () {

    self.socket = socket;
    self.host = host;
    self.port = port;

    socket.on('data', function (data) {
      var res = JSON.parse(data);
      switch (res.cmd) {
        case 'join':
          if (!res.stat || res.stat === 'NG') {
            this.destroy();
            self.emit('error', new Error()); // TODO: message
          } else {
            callback ? callback() : self.emit('connect');
          }
          break;
        default:
          break;
      }
    });

    // `connect` negociation
    var request = {
      cmd: 'join',
      type: 'client',
    };
    this.write(JSON.stringify(request));

  }); // end of connect

};

Client.prototype.disconnect = function (callback) {

  var self = this;

  if (!this.socket) {
    var err = new Error('NotConnect');
    if (callback) {
      callback(err);
    } else {
      this.emit('disconnect', err);
    }
    return;
  }

  this.socket.on('end', function () {
    delete self.host;
    delete self.port;
    self.socket.destroy();
    delete self.socket;
    if (callback) {
      callback();
    } else {
      self.emit('disconnect');
    }
  });

  this.socket.on('close', function (has_err) {
    console.log('con close event : ' + has_err);
  });

  var request = {
    cmd: 'leave',
    type: 'client'
  };
  this.socket.end(JSON.stringify(request));

};

Client.prototype.do = function (params) {
  throw new Error('Not Implemented');
};


function Task () {
  EventEmitter.call(this);
  throw new Error('Not Implemented');
}

util.inherits(Task, EventEmitter);


//
// export(s)
//

exports.Client = Client;
