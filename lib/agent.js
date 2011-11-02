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

function Agent () {
  EventEmitter.call(this);
}
util.inherits(Agent, EventEmitter);

Agent.prototype.start = function (port, callback) {
  this.DEBUG && assert(port | callback);

  var self = this;
  this.connections = [];
  this.server = net.createServer({
    allowHalfOpen: true
  }, function (connection) {
    logger.debug('occured `connection` event');

    self.connections.push(connection);
    connection.on('error', function (err) {
      self.emit('error', err);
    });

    connection.on('drain', function () {
      logger.debug('connection occured `drain` event');
    });

    connection.on('data', function (data) {
      var req = JSON.parse(data);
      switch (req.cmd) {
        case 'join':
          this.write(JSON.stringify({
            cmd: req.cmd,
            stat: 'OK'
          }));
          break;
        case 'leave':
          this.end();
          break;
        default:
          break;
      }
    });

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
    self.connections.forEach(function (connection) {
      connection.end();
    });
    self.emit('stop');
  });
  this.server.close();
};


//
// export(s)
//

module.exports.Agent = Agent;

