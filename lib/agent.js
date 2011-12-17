/**
 * agent.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

// 
// import(s)
//

var util = require('util');
var net = require('net');
var os = require('os');
var EventEmitter = require('./util').EventEmitter;
var assert = require('./util').assert;
var logger = require('./logger');
var common = require('./common');
var Job = common.Job;
var FrameParser = common.FrameParser;
var MessageParser = common.MessageParser;
var COMMANDS = common.COMMANDS;
var COMMAND_MAPS = common.COMMAND_MAPS;


//
// global valiable(s)
//

var __frmpsr = new FrameParser();
var __msgpsr = new MessageParser();


//
// function(s)
//

function createClient (connection, frmpsr, msgpsr) {
  var _modules = {};

  var client = Object.create(EventEmitter.prototype, {
    id: {
      get: function () {
        return util.format('%s__%s', connection.remoteAddress, connection.remotePort);
      },
      enumerable: true
    },
    modules: {
      get: function () { return _modules; },
      enumerable: true
    },
    registModule: {
      value: function (module) {
        _modules[module.name] = module;
        return this; 
      }
    },
    unregistModule: {
      value: function (name) {
        delete _modules[name];
        return this;
      }
    },
    unregistAllModule: {
      value: function (cb) {
        var self = this;
        Object.keys(_modules).forEach(function (name) {
          self.unregistModule(name);
          cb && cb(name);
        });
        return this;
      }
    },
    send: {
      value: function (msg, cb) {
        connection.write(frmpsr.shrink([msgpsr.pack(msg)]), function () {
          logger.debug('Client: write done (msg=%j)', msg);
          cb && cb();
        });
        return this;
      }
    },
    awake: {
      value: function () {
        if (this.type === 'worker') {
          this.send({ cmd: COMMANDS.COMMING_JOB });
        }
        return this;
      }
    },
    close: {
      value: function (active, cb) {
        var self = this;
        var active = arguments[0] || false;
        this.once('close', cb);

        connection.once('end', function () {
          logger.debug('Client: connection occured `end` event');
          if (!active) {
            connection.end();
          }
        });

        connection.once('close', function (err) {
          logger.debug('Client: connection occured `close` event (err=%s)', err);
          connection.removeAllListeners();
          self.emit('close');
          self.removeAllListeners();
        });

        if (active) {
          var msg = { cmd: COMMANDS.LEAVE };
          connection.end(frmpsr.shrink([msgpsr.pack(msg)]));
        }

        return this;
      }
    }
  });

  connection.setNoDelay();

  connection.on('error', function (err) {
    logger.debug('Client: conneciton occured `error` event (err=%s)', err);
    // TODO: should implmented error wrapping !!
    client.soonEmit('error', err);
    client.close(true, function () {
      logger.debug('Client: close done');
    });
  });

  connection.on('drain', function () {
    logger.debug('Client: connection occured `drain` event');
  });

  connection.on('data', function (data) {
    logger.debug('Client: conneciton occured `data` event (data=%s)', data);
    frmpsr.expand(data, function (frame) {
      var msg = msgpsr.unpack(frame);
      logger.debug('Client: parse message (msg=%j)', msg);
      client.emit(COMMAND_MAPS[msg.cmd], msg);
    });
  });

  return client;
}

function getModuleName (ns, func) {
  return util.format('%s%s', ns, func);
}

function createModule (ns, func) {
  var _clients = {};

  var module = Object.create({}, {
    ns: {
      value: ns,
      enumerable: true
    },
    func: {
      value: func,
      enumerable: true
    },
    name: {
      get: function () {
        return getModuleName(this.ns, this.func);
      },
      enumerable: true
    },
    clients: {
      get: function () {
        return _clients;
      },
      enumerable: true
    },
    addClient: {
      value: function (client) {
        _clients[client.id] = client;
        return this;
      }
    },
    removeClient: {
      value: function (id) {
        delete _clients[id];
        return this;
      }
    }
  });

  return module;
}

function createJob (counter) {

  var timestamp = new Date().getTime();
  var host = os.hostname();
  // TODO: should design job id.
  var _id = util.format('%d::%d::%s', counter, timestamp, host);

  var job = Object.create(EventEmitter.prototype, {
    id: {
      get: function () { return _id; },
      enumerable: true
    }
  });

  return job;
}


// 
// class(es)
//

function Agent () {

  var agent = Object.create(Agent.prototype, {
    frmpsr: {
      get: function () { return __frmpsr; },
    },
    msgpsr: {
      get: function () { return __msgpsr; }
    }
  });

  return agent;
}

Agent.prototype = Object.create(EventEmitter.prototype, {
  start: {
    value: function (port, cb) {
      this.DEBUG && assert(port | cb);

      var self = this;
      var frmpsr = this.frmpsr;
      var msgpsr = this.msgpsr;
      this.clients = {};
      this.modules = {};
      var count = 0;
      var req_job_queue = [];
      var exe_jobs = {};
      var timeout_jobs = {};

      function wakeupWorker (ns, func) {
        var module = self.modules[getModuleName(ns, func)];
        if (module) {
          for (var id in module.clients) {
            module.clients[id].awake();
          }
        }
      }

      var options = { allowHalfOpen: false };
      var server = net.createServer(options, function (connection) {
        logger.debug('Agent: occured `connection` event (remoteAddress %s, remotePort %s)', connection.remoteAddress, connection.remotePort);

        var client = createClient(connection, frmpsr, msgpsr);

        client.on(COMMAND_MAPS[COMMANDS.JOIN], function (msg) {
          logger.info('Agent: client `JOIN` event (msg=%j)', msg);
          this.type = msg.type;
          self.clients[this.id] = this;
          this.send({ cmd: COMMANDS.JOIN, stat: 'OK' });
        });

        client.on(COMMAND_MAPS[COMMANDS.LEAVE], function (msg) {
          logger.info('Agent: client `LEAVE` event (msg=%j)', msg);
          var id = this.id;
          this.close(true, function () {
            this.unregistAllModule(function (name) {
              var module = self.modules[name];
              module.removeClient(id);
              if (Object.keys(module.clients).length === 0) {
                delete self.modules[name];
              }
            });
            delete self.clients[id];
          });
        });

        client.on(COMMAND_MAPS[COMMANDS.SUBMIT_JOB], function (msg) {
          logger.info('Agent: client `SUBMIT_JOB` event (msg=%j)', msg);
          var job = createJob(++count);
          job.ns = msg.params.ns;
          job.func = msg.params.func;
          job.args = msg.params.args;
          job.timeout = msg.params.timeout;
          job.client = this.id;
          job.timer = null;
          logger.debug('Agent: create job (%j)', job);
          req_job_queue.push(job);
          wakeupWorker(msg.params.ns, msg.params.func);
          this.send({
            cmd: COMMANDS.CREATED_JOB,
            seq: msg.seq,
            job: {
              id: job.id,
              ns: job.ns,
              func: job.func
            }
          });
        });

        client.on(COMMAND_MAPS[COMMANDS.REGIST_WORKER], function (msg) {
          logger.info('Agent: client `REGIST_WORKER` event (msg=%j)', msg);
          var name = getModuleName(msg.params.ns, msg.params.func);
          var module = self.modules[name] || createModule(msg.params.ns, msg.params.func);
          module.addClient(this);
          this.registModule(module);
          self.modules[name] = module;
          this.send({
            cmd: COMMANDS.REGIST_WORKER,
            stat: 'OK'
          });
        });

        client.on(COMMAND_MAPS[COMMANDS.GET_JOB], function (msg) {
          logger.info('Agent: client `GET_JOB` event (msg=%j)', msg);
          if (req_job_queue.length === 0) {
            this.send({ cmd: COMMANDS.NO_JOB });
          } else {
            var job = req_job_queue[0];
            if (!this.modules[getModuleName(job.ns, job.func)]) {
              this.send({
                cmd: COMMANDS.ERROR,
                message: 'No Ability'
              });
            }
            job = req_job_queue.shift();
            if (!exe_jobs[this.id]) {
              exe_jobs[this.id] = {};
            }
            exe_jobs[this.id][job.id] = job;
            logger.debug('Agent : job(id) = %s, exe_jobs[%s] = %j', job.id, this.id, exe_jobs[this.id]);
            this.send({
              cmd: COMMANDS.ASSIGNED_JOB,
              ns: job.ns,
              func: job.func,
              job: {
                id: job.id,
                args: job.args || {}
              }
            });
          }
        });

        client.on(COMMAND_MAPS[COMMANDS.NO_JOB], function (msg) {
          logger.info('Agent: client `NO_JOB` event (msg=%j)', msg);
        });

        client.on(COMMAND_MAPS[COMMANDS.COMMING_JOB], function (msg) {
          logger.info('Agent: client `COMMING_JOB` event (msg=%j)', msg);
        });

        client.on(COMMAND_MAPS[COMMANDS.COMPLETE_JOB], function (msg) {
          logger.info('Agent: client `COMPLETE_JOB` event (msg=%j)', msg);
          var jobs = exe_jobs[this.id];
          if (jobs) {
            var job = jobs[msg.job.id];
            var client = self.clients[job.client];
            client.send({
              cmd: COMMANDS.COMPLETE_JOB,
              job: {
                id: job.id,
                result: msg.job.result
              }
            });
            job.timer = null;
            delete jobs[job.id];
            if (!Object.keys(jobs).length) {
              delete exe_jobs[this.id];
            }
            logger.debug('Agent: exe_jobs[%s] = %j', this.id, exe_jobs[this.id]);
          }
        });

        client.on(COMMAND_MAPS[COMMANDS.FAILED_JOB], function (msg) {
          logger.info('Agent: client `FAILED_JOB` event (msg=%j)', msg);
          var jobs = exe_jobs[this.id];
          if (jobs) {
            var job = jobs[msg.job.id];
            var client = self.clients[job.client];
            client.send({
              cmd: COMMANDS.FAILED_JOB,
              job: {
                id: job.id,
                result: msg.job.result
              }
            });
            job.timer = null;
            delete jobs[job.id];
            if (!Object.keys(jobs).length) {
              delete exe_jobs[this.id];
            }
            logger.debug('Agent: exe_jobs[%s] = %j', this.id, exe_jobs[this.id]);
          }
        });

      }); // end of net.createServer

      server.on('error', function (err) {
        logger.error('Agent : server occured `error` event -> %j', err);
        // TODO: should wrapped error. 
        self.soonEmit('error', err);    
        logger.debug('Agent : fire `error` event');
      });

      cb && this.once('start', cb);

      server.listen(port, function () {
        logger.debug('Agent : server occured `listening` event');
        self.server = server;
        self.emit('start');
        logger.debug('Agent : fire `start` event');
      });
    }
  }, // end of start
  stop: {
    value: function (cb) {
      var self = this;
      var server = this.server;

      function closeClients (clients, cb) {
        var length = Object.keys(clients).length;
        var counter = 0;
        if (length === 0) {
          process.nextTick(cb);
          return;
        }
        Object.keys(clients).forEach(function (id) {
          var client = clients[id];
          client.close(true, function () {
            logger.debug('Agent: client close');
            counter++;
            if (length === counter) {
              process.nextTick(cb);
            }
          });
          logger.debug('Agent: %s connection closing ...', id);
        });
      } // end of closeclients

      cb && this.once('stop', cb);

      closeClients(this.clients, function () {
        server.once('close', function () {
          logger.debug('Agent: server occured `close` event');
          self.emit('stop');
          server.removeAllListeners();
          delete self.server;
          logger.debug('Agent: fire `stop` event');
        });
        server.close();
      });
    } // end of stop
  }
}); // end of Agent.prototype


//
// export(s)
//

module.exports.Agent = Agent;

