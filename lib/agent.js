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
var os = require('os');
var assert = require('./util').assert;
var logger = require('./logger');
var common = require('./common');
var Job = common.Job;
var FrameParser = common.FrameParser;
var Message = common.Message;


// 
// class(es)
//

function Agent () {

  EventEmitter.call(this);
  this.frmpsr = new FrameParser();
  this.msg = new Message();

}

util.inherits(Agent, EventEmitter);

Agent.prototype.start = function (port, callback) {
  this.DEBUG && assert(port | callback);

  var self = this;
  this.clients = {};
  this.workers = {};
  this.modules = {};
  var count = 0;
  var reqJobQ = [];
  var resJobQ = [];

  var connectionID = function (connection) {
    return util.format('%s__%s', connection.remoteAddress, connection.remotePort);
  };
  var createJob = function () {
    var job = new Job();
    count++;
    var timestamp = (new Date()).getTime();
    var host = os.hostname();
    // TODO: should design job id.
    var id = util.format('%d::%d::%s', count, timestamp, host);
    job.id = id;
    return job;
  };

  this.server = net.createServer({
    allowHalfOpen: true
  }, function (connection) {
    logger.debug('Agent : occured `connection` event (remoteAddress %s, remotePort %s)', connection.remoteAddress, connection.remotePort);

    connection.setNoDelay();

    connection.on('error', function (err) {
      self.emit('error', err);
    });

    connection.on('drain', function () {
      logger.debug('Agent : connection occured `drain` event');
    });

    connection.on('data', function (data) {
      logger.debug('Agent : recieve data -> %s', data);
      var con = this;
      var frmpsr = self.frmpsr;
      var msg = self.msg;
      var frames = frmpsr.expand(data);
      if (!frames) {
        self.emit('error', new Error('Not Expected Error'));
        return;
      }
      frames.forEach(function (frame) {
        var req = msg.unpack(frame);
        switch (req.cmd) {
          case common.CMD_JOIN:
            if (req.type === 'client') {
              self.clients[connectionID(con)] = con;
            } else {
              self.workers[connectionID(con)] = con;
            }
            con.write(frmpsr.shrink([
              msg.pack({
                cmd: req.cmd,
                stat: 'OK'
              })
            ]));
            break;
          case common.CMD_LEAVE:
            var id = connectionID(con);
            con.end();
            if (req.type === 'client') {
              delete self.clients[id];
            } else {
              delete self.workers[id];
            }
            break;
          case common.CMD_SUBMIT_JOB:
            var job = createJob();
            reqJobQ.push(job);
            con.write(frmpsr.shrink([
              msg.pack({
                cmd: common.CMD_JOB_CREATED,
                job: {
                  id: job.id
                }
              })
            ]));
            break;
          case common.CMD_REGIST_WORKER:
            var id = connectionID(con);
            var module_name = util.format('%s%s', req.params.ns, req.params.func);
            var module = self.modules[module_name] || {};
            module[id] = con;
            self.modules[module_name] = module;
            con.write(frmpsr.shrink([
              msg.pack({
                cmd: req.cmd,
                stat: 'OK'
              })
            ]));
            break;
          default:
            self.emit('error', new Error('Unknown Command Error'));
            break;
        }
      }); // end of frames.forEach
    }); // end of connection.on('data')

  }); // end of net.createServer

  this.server.on('error', function (err) {
    logger.error('Agent : occured `error` event');
    self.emit('error', err);    
  });

  this.server.listen(port, function () {
    logger.debug('Agent : occured `listening` event');
    callback();
  });

};

Agent.prototype.stop = function () {

  var self = this;

  this.server.on('close', function () {
    logger.debug('Agent : occured `close` event');
    [self.clients, self.workers].forEach(function (connections) {
      Object.keys(connections).forEach(function (key) {
        connections[key].end();
        connections[key].destroy();
      });
    });
    self.emit('stop');
  });

  this.server.close();

};


//
// export(s)
//

module.exports.Agent = Agent;

