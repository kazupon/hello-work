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
var FrameParser = common.FrameParser;


//
// constant(s)
//
var REGEX_HOSTNAME = /^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$/;
var REGEX_IPADDRESS = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;


//
// clsss(es)
//

/**
 * Base class
 * @class Base
 * @constructor
 */
function Base () {

  EventEmitter.call(this);

  this.port = null;
  this.host = null;
  this.socket = null;
  this.frmpsr = new FrameParser();
  this.onCommand = function (res) {};

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
  socket.setMaxListeners(0); // TODO: Will this do ? memory leaks ...

  socket.on('error', function (err) {
    if (self.socket) { // connected
      self.emit('error', err);
    } else { // close
      callback ? callback(err) : self.emit('connect', err);
    }
  });

  socket.connect(port, host, function () {

    socket.setNoDelay();
    self.socket = socket;
    self.host = host;
    self.port = port;

    var frmpsr = self.frmpsr;
    var listener = function (data) {
      var frames = frmpsr.expand(data);
      if (!frames) {
        callback ? callback(err) : self.emit('error', new Error('Not Expected Error'));
        return;
      }
      frames.forEach(function (frame) {
        var res = JSON.parse(frame);
        if (res.cmd === common.CMD_JOIN) {
          if (!res.stat || res.stat === 'NG') {
            self.socket.destroy();
            self.emit('error', new Error()); // TODO: error message
          } else {
            callback ? callback() : self.emit('connect');
          }
        } else { // other
          self.onCommand(res);
        }
      });
    };
    self.onData = listener;
    socket.on('data', listener);

    // `connect` negociation
    var req = {
      cmd: common.CMD_JOIN,
      type: self.type
    };
    this.write(frmpsr.shrink([JSON.stringify(req)]));

  }); // end of connect

};

/**
 * Disconnect a conneciton from hellowork server.
 * @method disconnect
 * @param {Function} callback a callback function
 */
Base.prototype.disconnect = function (callback) {

  if (!this.socket) {
    var err = new Error('NotConnect');
    callback ? callback(err) : this.emit('disconnect', err);
    return;
  }

  var self = this;
  var socket = this.socket;

  socket.once('end', function () {
    self.host = null;
    self.port = null;
    self.socket.destroy();
    self.socket = null;
    callback ? callback() : self.emit('disconnect');
  });

  socket.once('close', function (has_err) {
    console.log('con close event : ' + has_err);
  });

  var req = {
    cmd: common.CMD_LEAVE,
    type: this.type
  };
  socket.end(this.frmpsr.shrink([JSON.stringify(req)]));

  socket.removeListener('data', this.onData);
  delete this.onData;

};


//
// export(s)
//

exports.Base = Base;

