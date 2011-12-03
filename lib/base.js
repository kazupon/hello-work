/**
 * base.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var util = require('util');
var net = require('net');
var EventEmitter = require('./util').EventEmitter;
var common = require('./common');
var FrameParser = common.FrameParser;
var MessageParser = common.MessageParser;
var COMMANDS = common.COMMANDS;
var COMMAND_MAPS = common.COMMAND_MAPS;
var DEBUG = common.DEBUG;


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

  this.status = 'closed';
  this.port = null;
  this.host = null;
  this.socket = null;
  this.frmpsr = new FrameParser();
  this.msgpsr = new MessageParser();
  this.command = Object.create(EventEmitter.prototype);
  this.command.setMaxListeners(0); // TODO: Will this do ? memory leaks ...
  
  var self = this;

  //
  // command handlers
  //
  this.command.on(COMMAND_MAPS[COMMANDS.JOIN], function (msg) {
    if (!msg.stat || msg.stat === 'NG') {
      self.socket.destroy();
      self.soonEmit('error', new Error('Not Expected Error'));
    } else {
      self.emit('connect');
    }
  });

  this.command.on(COMMAND_MAPS[COMMANDS.LEAVE], function (msg) {
    self._close();
  });

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
  DEBUG && console.debug('connect (status = %s)', this.status);

  var self = this;

  var options;
  var callback;
  if (typeof arguments[0] === 'object') {
    options = arguments[0];
    callback = arguments[1];
  } else {
    callback = arguments[0];
  }
  callback && this.once('connect', callback);

  if (this.status === 'connecting' || this.status === 'connected') {
    var err = new Error('AlreadyConnect');
    this.soonEmit('connect', err);
    return this;
  }

  var port = 20000;
  if (options && (options.port !== undefined)) {
    port = options.port;
  }
  if (port <= 1024 || port >= 65536) {
    var err = new Error('InvalidParameter');
    this.soonEmit('connect', err);
    return this;
  }

  var host = 'localhost';
  if (options && (options.host !== undefined)) {
    host = options.host;
  }
  if ((!REGEX_HOSTNAME.test(host) & !REGEX_IPADDRESS.test(host))) {
    var err = new Error('InvalidParameter');
    this.soonEmit('connect', err);
    return this;
  }

  this.status = 'connecting';

  var socket = new net.Socket({
    allowHalfOpen: false
  });
  socket.setMaxListeners(0); // TODO: Will this do ? memory leaks ...

  socket.connect(port, host, function () {

    self.status = 'connected';
    self.socket = socket;
    self.host = host;
    self.port = port;

    socket.setNoDelay();

    var frmpsr = self.frmpsr;
    var listener = function (data) {
      frmpsr.expand(data, function (frame) {
        var msg = self.msgpsr.unpack(frame);
        DEBUG && console.debug('Base : command event : %j', msg);
        self.command.emit(COMMAND_MAPS[msg.cmd], msg);
      });
    };
    self.onData = listener;
    socket.on('data', listener);

    // `connect` negociation
    var req = {
      cmd: COMMANDS.JOIN,
      type: self.type
    };
    this.write(frmpsr.shrink([self.msgpsr.pack(req)]));

  }); // end of connect

  socket.on('error', function (err) {
    if (self.socket) { // connected
      self.soonEmit('error', err);
      self.disconnect(function (err) {
        DEBUG && console.wran('disconnect');
      });
    } else { // close
      self.soonEmit('connect', err);
    }
  });

  return this;
};

/**
 * Disconnect a conneciton from hellowork server.
 * @method disconnect
 * @param {Function} callback a callback function
 */
Base.prototype.disconnect = function (callback) {
  DEBUG && console.debug('disconnect (status = %s)', this.status);

  var self = this;

  callback && this.once('disconnect', callback);

  if (this.status !== 'connected') {
    var err = new Error('NotConnect');
    this.soonEmit('disconnect', err);
    return this;
  }

  var req = {
    cmd: COMMANDS.LEAVE,
    type: this.type
  };
  this._close(true, this.frmpsr.shrink([this.msgpsr.pack(req)]));

  return this;
};

Base.prototype._close = function (/* active, msg */) {
  var active = arguments[0] || false;
  var msg = arguments[1];
  var socket = this.socket;
  var self = this;

  socket.once('end', function () {
    DEBUG && console.debug('Base : socket `end` event');
    if (!active) {
      socket.end(msg);
    }
  });

  socket.once('close', function (err) {
    DEBUG && console.debug('Base : socket `close` event (%s)', err);
    self.host = null;
    self.port = null;
    self.socket = null;
    self.status = 'closed';
    self.emit('disconnect');
  });

  if (active) {
    socket.end(msg);
  }

  this.status = 'closing';
  socket.removeListener('data', this.onData);
  delete this.onData;
};

//
// export(s)
//

exports.Base = Base;

