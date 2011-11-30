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
var COMMANDS = common.COMMANDS;
var COMMAND_MAPS = common.COMMAND_MAPS;
var FrameParser = common.FrameParser;
var MessageParser = common.MessageParser;


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
    var socket = self.socket;
    socket.once('end', function () {
      console.log('base socket `end` event (passive close)');
      socket.end();
      socket.removeListener('data', self.onData);
      delete self.onData;
    });
    socket.once('close', function (err) {
      console.log('base socket `end` event (passive close) -> %s', err);
      self.port = null;
      self.host = null;
      self.socket = null;
      // TODO: should implmented error case !!
      self.emit('disconnect');
    });
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

  if (this.socket) {
    var err = new Error('AlreadyConnect');
    this.soonEmit('connect', err);
    return;
  }

  var port = 20000;
  if (options && (options.port !== undefined)) {
    port = options.port;
  }
  if (port <= 1024 || port >= 65536) {
    var err = new Error('InvalidParameter');
    this.soonEmit('connect', err);
    return;
  }

  var host = 'localhost';
  if (options && (options.host !== undefined)) {
    host = options.host;
  }
  if ((!REGEX_HOSTNAME.test(host) & !REGEX_IPADDRESS.test(host))) {
    var err = new Error('InvalidParameter');
    this.soonEmit('connect', err);
    return;
  }

  var socket = new net.Socket({
    allowHalfOpen: false
  });
  socket.setMaxListeners(0); // TODO: Will this do ? memory leaks ...

  socket.on('error', function (err) {
    if (self.socket) { // connected
      self.soonEmit('error', err);
    } else { // close
      self.soonEmit('connect', err);
    }
  });

  socket.connect(port, host, function () {

    socket.setNoDelay();
    self.socket = socket;
    self.host = host;
    self.port = port;

    var frmpsr = self.frmpsr;
    var listener = function (data) {
      frmpsr.expand(data, function (frame) {
        var msg = self.msgpsr.unpack(frame);
        console.log('command event : %j', msg);
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

};

/**
 * Disconnect a conneciton from hellowork server.
 * @method disconnect
 * @param {Function} callback a callback function
 */
Base.prototype.disconnect = function (callback) {

  var self = this;

  callback && this.once('disconnect', callback);

  if (!this.socket) {
    var err = new Error('NotConnect');
    this.soonEmit('disconnect', err);
    return;
  }

  var socket = this.socket;
  socket.once('end', function () {
    console.log('base socket `end` event (active close)');
    self.host = null;
    self.port = null;
    //self.socket.destroy();
    self.socket = null;
  });

  socket.once('close', function (err) {
    console.log('base socket `close` event (active close) -> %s', err);
    self.emit('disconnect');
  });

  var req = {
    cmd: COMMANDS.LEAVE,
    type: this.type
  };
  socket.end(this.frmpsr.shrink([this.msgpsr.pack(req)]));

  socket.removeListener('data', this.onData);
  delete this.onData;
};


//
// export(s)
//

exports.Base = Base;

