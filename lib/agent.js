/**
 * agent.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

// 
// import(s)
//

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var net = require('net');
var assert = require('./util').assert;
var logger = require('./logger');


// 
// class(es)
//

function Client (connection) {
  EventEmitter.call(this);
}
util.inherits(Client, EventEmitter);

function Agent () {
  EventEmitter.call(this);
}
util.inherits(Agent, EventEmitter);

Agent.prototype.start = function (port, callback) {
  this.DEBUG && assert(port | callback);

  var self = this;
  this.server = net.createServer(function (connection) {
    logger.debug('occured `connection` event');
  });

  this.server.on('error', function (err) {
    logger.error('occured `error` event');
    self.emit('error', err);    
  });

  this.server.listen(port, function () {
    logger.debug('occured `listening` event');
    callback();
  });
};

Agent.prototype.stop = function () {
  var self = this;
  this.server.on('close', function () {
    logger.debug('occured `close` event');
    self.emit('stop');
  });
  this.server.close();
};


//
// export(s)
//

module.exports.Agent = Agent;

