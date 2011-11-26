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

function Client () {
  
  EventEmitter.call(this);

}
util.inherits(Client, EventEmitter);


function Agent () {

  EventEmitter.call(this);
  this.frmpsr = new FrameParser();
  this.msg = new Message();

}

util.inherits(Agent, EventEmitter);

Agent.prototype.start = function (port, callback) {
  this.DEBUG && assert(port | callback);

  var self = this;
  var frmpsr = this.frmpsr;
  var msg = this.msg;
  this.clients = {};
  this.workers = {};
  this.modules = {};
  var count = 0;
  var exeJobs= {};
  var timeoutJobs = {};
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
  var wakeupWorker = function (job) {
    var modules = self.modules;
    var name = util.format('%s%s', job.ns, job.func);
    var workers = modules[name];
    if (workers) {
      Object.keys(workers).forEach(function (id) {
        var worker = workers[id];
        worker.write(frmpsr.shrink([
          msg.pack({
            cmd: common.CMD_COMMING_JOB
          })
        ]));
      });
    }
  };

  var server = net.createServer({
    allowHalfOpen: false
  }, function (connection) {
    logger.debug('Agent : occured `connection` event (remoteAddress %s, remotePort %s)', connection.remoteAddress, connection.remotePort);

    connection.setNoDelay();

    connection.on('error', function (err) {
      logger.debug('Agent : conneciton occured `error` event -> %s', err);
      // TODO: should implmented error wrapping !!
      process.nextTick(self.emit.bind(self ,'error', err));
      logger.debug('Agent : fire `error` event');
    });

    connection.on('drain', function () {
      logger.debug('Agent : connection occured `drain` event');
    });

    connection.on('data', function (data) {
      logger.debug('Agent : recieve data -> %s', data);
      var con = this;
      var frames = frmpsr.expand(data);
      if (!frames) {
        process.nextTick(self.emit.bind(self, 'error', new Error('Not Expected Error')));
        logger.debug('Agent : fire `error` event');
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
            con.once('end', function () {
              logger.debug('Agent : conneciton `end` event (passive close)');
              con.end();
            });
            con.once('close', function (err) {
              logger.debug('Agent : conneciton `close` event (passive close) -> %s', err);
              // TODO: should implmented error case.
              if (req.type === 'client') {
                delete self.clients[id];
              } else {
                delete self.workers[id];
              }
            });
            break;
          case common.CMD_SUBMIT_JOB:
            var job = createJob();
            job.ns = req.params.ns;
            job.func = req.params.func;
            job.args = req.params.args;
            job.timeout = req.params.timeout;
            job.client = connectionID(con);
            job.timer = null;
            logger.debug('Agent : command = CMD_SUBMIT_JOB, req = %j, job = %j', req, job);
            if (job.timeout > 0) {
              job.timer = setTimeout(function (job, con) {
                logger.debug('Agent : invoke timer -> job = %j', job);
                if (!job.timer || !con) {
                  return;
                }
                var removed = false;
                var reason = -1;
                if (exeJobs[id]) {
                  logger.info('Agent : job exists in exeJobs');
                  delete exeJobs[id];
                  removed = true;
                  job.timer = null;
                  reason = 1;  // TODO: should be const value
                } else {
                  var index = reqJobQ.indexOf(job);
                  if (index !== -1) {
                    logger.info('Agent : job exists in reqJobQ');
                    reqJobQ.splice(index, 1); 
                    removed = true;
                    job.timer = null;
                    reason = 2;  // TODO: should be const value
                  }
                }
                if (removed | (reason !== -1)) {
                  if (!con) {
                    logger.warn('Agent : connection (id:%s) is nothing !!', job.client);
                    return;
                  }
                  try {
                    con.write(frmpsr.shrink([
                      msg.pack({
                        cmd: common.CMD_TIMEOUT_JOB,
                        job: {
                          id: job.id,
                          code: reason
                        }
                      })
                    ]));
                    logger.info('Agent : connection write');
                  } catch (e) {
                    logger.error('Agent : timeout write error -> %s', e.message);
                  }
                } else {
                  logger.info('Agent : do not timeout !!');
                }
              }, job.timeout, job, con);
            }
            reqJobQ.push(job);
            wakeupWorker(job);
            con.write(frmpsr.shrink([
              msg.pack({
                cmd: common.CMD_CREATED_JOB,
                job: {
                  id: job.id,
                  ns: job.ns,
                  func: job.func
                }
              })
            ]));
            break;
          case common.CMD_REGIST_WORKER:
            var id = connectionID(con);
            logger.debug('Agent : command = CMD_REGIST_WORKER, id = %s', id);
            var name = util.format('%s%s', req.params.ns, req.params.func);
            var module = self.modules[name] || {};
            module[id] = con;
            self.modules[name] = module;
            con.write(frmpsr.shrink([
              msg.pack({
                cmd: req.cmd,
                stat: 'OK'
              })
            ]));
            break;
          case common.CMD_GET_JOB:
            if (reqJobQ.length === 0) {
              con.write(frmpsr.shrink([
                msg.pack({
                  cmd: common.CMD_NO_JOB
                })
              ]));
            } else {
              var job = reqJobQ.pop();
              exeJobs[connectionID(con)] = job;
              logger.debug('Agent : command = CMD_GET_JOB, job(id) = %s, exeJobs(keys) = %s', job.id, Object.keys(exeJobs));
              con.write(frmpsr.shrink([
                msg.pack({
                  cmd: common.CMD_ASSIGNED_JOB,
                  job: {
                    id: job.id,
                    args: job.args || {}
                  }
                })
              ]));
            }
            break;
          case common.CMD_COMPLETE_JOB:
          case common.CMD_FAILED_JOB:
            var id = connectionID(con);
            var job = exeJobs[id];
            if (job) {
              var client = self.clients[job.client];
              client.write(frmpsr.shrink([
                msg.pack({
                  cmd: req.cmd,
                  job: {
                    id: job.id,
                    result: req.job.result
                  }
                })
              ]));
              delete exeJobs[id];
              job.timer = null;
              logger.debug('Agent : command = %d, exeJobs(keys) = %j', req.cmd, Object.keys(exeJobs));
            }
            break;
          default:
            process.nextTick(self.emit.bind(self, 'error', new Error('Unknown Command Error')));
            logger.debug('Agent : fire `error` event');
            break;
        }
      }); // end of frames.forEach
    }); // end of connection.on('data')

  }); // end of net.createServer

  server.on('error', function (err) {
    logger.error('Agent : server occured `error` event -> %j', err);
    // TODO: should wrapped error. 
    process.nextTick(self.emit.bind(self, 'error', err));    
    logger.debug('Agent : fire `error` event');
  });

  callback && this.once('start', callback);

  server.listen(port, function () {
    logger.debug('Agent : server occured `listening` event');
    self.server = server;
    process.nextTick(self.emit.bind(self, 'start'));
    logger.debug('Agent : fire `start` event');
  });

};

Agent.prototype.stop = function (callback) {

  var self = this;
  var server = this.server;
  var closeClients = function (clients, frmpsr, msg, callback) {
    var managed_clients = Object.keys(clients[0]).length + Object.keys(clients[1]).length;
    var counter = 0;
    if (managed_clients === 0) {
      process.nextTick(callback);
      return;
    }
    clients.forEach(function (connections) {
      Object.keys(connections).forEach(function (key) {
        var connection = connections[key];
        connection.once('end', function () {
          logger.debug('Agent : connection `end` event (active close)');
        });
        connection.once('close', function (err) {
          logger.debug('Agent : connection `close` event (active close) -> %s', err);
          counter++;
          logger.debug('counter = %s, managed_clients = %d', counter, managed_clients);
          if (managed_clients === counter) {
            process.nextTick(callback);
          }
        });
        var req = {
          cmd: common.CMD_LEAVE
        };
        connection.end(frmpsr.shrink([msg.pack(req)]));
        logger.debug('Agent : %s connection closing ...', key);
      });
    });
  };

  callback && this.once('stop', callback);

  closeClients([this.clients, this.workers], this.frmpsr, this.msg, function () {

    server.once('close', function () {
      logger.debug('Agent : server occured `close` event');
      process.nextTick(self.emit.bind(self, 'stop'));
      logger.debug('Agent : fire `stop` event');
    });

    server.close();

  });

};


//
// export(s)
//

module.exports.Agent = Agent;

