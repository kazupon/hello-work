/**
 * base.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var net = require('net');
var common = require('./common');


//
// constant(s)
//
var REGEX_HOSTNAME = /^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$/;
var REGEX_IPADDRESS = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;


//
// clsss(es)
//

function Base () {
  EventEmitter.call(this);
  this.port = null;
  this.host = null;
  this.socket = null;
  this.cmds = {};

  var self = this;
  this.cmds[common.CMD_JOIN] = function (res, callback) { // JOIN
    if (!res.stat || res.stat === 'NG') {
      self.socket.destroy();
      self.emit('error', new Error()); // TODO: error message
    } else {
      callback ? callback() : self.emit('connect');
    }
  };
}

util.inherits(Base, EventEmitter);


/**
 * Connect to hellowork server.
 * @method connect
 * @param {Object} [options] an option parameters.
 * @param {Number} [options.port] a port number.
 * @param {String} [options.hsot] a hostname.
 * @param {Function} [callback] a callback function. 
 */
Base.prototype.connect = function (/*options, callback*/) {

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
    callback ? callback(err) : this.emit('connect', err);
    return;
  }

  var port = 20000;
  if (options && (options.port !== undefined)) {
    port = options.port;
  }
  if (port <= 1024 || port >= 65536) {
    var err = new Error('InvalidParameter');
    callback ? callback(err) : this.emit('connect', err);
    return;
  }

  var host = 'localhost';
  if (options && (options.host !== undefined)) {
    host = options.host;
  }
  if ((!REGEX_HOSTNAME.test(host) & !REGEX_IPADDRESS.test(host))) {
    var err = new Error('InvalidParameter');
    callback ? callback(err) : this.emit('connect', err);
    return;
  }

  var socket = new net.Socket({
    allowHalfOpen: true
  });
  socket.on('error', function (err) {
    if (self.socket) { // connected
      self.emit('error', err);
    } else { // close
      callback ? callback(err) : self.emit('connect', err);
    }
  });

  socket.connect(port, host, function () {

    self.socket = socket;
    self.host = host;
    self.port = port;

    socket.once('data', function (data) {
      var res = JSON.parse(data);
      var cmd = self.cmds[res.cmd];
      if (cmd) {
        cmd(res, callback);
      }
    });

    // `connect` negociation
    var request = {
      cmd: common.CMD_JOIN,
      type: this.type
    };
    this.write(JSON.stringify(request));

  }); // end of connect

};

Base.prototype.disconnect = function (callback) {

  var self = this;

  if (!this.socket) {
    var err = new Error('NotConnect');
    callback ? callback(err) : this.emit('disconnect', err);
    return;
  }

  this.socket.on('end', function () {
    self.host = null;
    self.port = null;
    self.socket.destroy();
    self.socket = null;
    callback ? callback() : self.emit('disconnect');
  });

  this.socket.on('close', function (has_err) {
    console.log('con close event : ' + has_err);
  });

  var request = {
    cmd: common.CMD_LEAVE,
    type: this.type
  };
  this.socket.end(JSON.stringify(request));

};


//
// export(s)
//

exports.Base = Base;

