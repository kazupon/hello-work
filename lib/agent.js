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
var common = require('./common');
var FrameParser = common.FrameParser;


// 
// class(es)
//

function Agent () {
  EventEmitter.call(this);
  this.frmpsr = new FrameParser();
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

    connection.setNoDelay();
    self.connections.push(connection);

    connection.on('error', function (err) {
      self.emit('error', err);
    });

    connection.on('drain', function () {
      logger.debug('connection occured `drain` event');
    });

    connection.on('data', function (data) {
      logger.debug('server data : %s', data);
      var con = this;
      var frmpsr = self.frmpsr;
      frmpsr.expand(data).forEach(function (frame) {
        var req = JSON.parse(frame);
        switch (req.cmd) {
          case common.CMD_JOIN:
            con.write(self.frmpsr.shrink([
              JSON.stringify({
                cmd: req.cmd,
                stat: 'OK'
              })
            ]));
            break;
          case common.CMD_LEAVE:
            con.end();
            break;
          case common.CMD_SUBMIT_JOB:
            // TODO: create job
            var timestamp = (new Date()).getTime();
            con.write(frmpsr.shrink([
              JSON.stringify({
                cmd: common.CMD_JOB_CREATED,
                job: {
                  id: timestamp
                }
              })
            ]));
            break;
          case common.CMD_CREATED_JOB:
            break;
          default:
            break;
        }
      }); // end of frmpsr.expand(...).forEach
    }); // end of connection.on('data')

  }); // end of net.createServer

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

