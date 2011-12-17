/**
 * worker.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var util = require('util');
var format = require('util').format;
var net = require('net');
var EventEmitter = require('./util').EventEmitter;
var Base = require('./base').Base;
var common = require('./common');
var COMMANDS = common.COMMANDS;
var COMMAND_MAPS = common.COMMAND_MAPS;
var DEBUG = common.DEBUG;
var Job = common.Job;


//
// class(es)
//

function Worker () {

  Base.call(this);
  this.type = 'worker';

  var self = this;
  var frmpsr = this.frmpsr;
  var msgpsr = this.msgpsr;
  this.regist_cbs = {};

  //
  // command handler
  //
  this.command.on(COMMAND_MAPS[COMMANDS.REGIST_WORKER], function (msg) {
    if (msg.stat !== 'OK') {
      self.soonEmit('error', new Error('Not Expected Error'));
    }
  });

  this.command.on(COMMAND_MAPS[COMMANDS.COMMING_JOB], function (msg) {
    var req = {
      cmd: COMMANDS.GET_JOB
    };
    self.socket.write(frmpsr.shrink([msgpsr.pack(req)]));
  });

  this.command.on(COMMAND_MAPS[COMMANDS.ASSIGNED_JOB], function (msg) {
    var cb_key = format('%s%s', msg.ns, msg.func);
    var cb = self.regist_cbs[cb_key];
    if (!cb) {
      DEBUG && console.warn('Cannot process assigned job !!');
      return;
    }
    var job = new Job();
    job.id = msg.job.id;
    job.args = msg.job.args;
    var req = {
      cmd: COMMANDS.COMPLETE_JOB,
      job: {
        id: job.id,
        result: {}
      }
    };
    try {
      cb(job, function (ret) {
        if (ret instanceof Error) {
          req.cmd = COMMANDS.FAILED_JOB;
          req.job.result = { message: ret.message, code: ret.code };
        } else {
          req.job.result = ret;
        }
        process.nextTick(function () {
          self.socket.write(frmpsr.shrink([msgpsr.pack(req)]));
        });
      });
    } catch (e) {
      req.cmd = COMMANDS.FAILED_JOB;
      req.job.result = { message: e.message, code: e.code };
      process.nextTick(function () {
        self.socket.write(frmpsr.shrink([msgpsr.pack(req)]));
      });
    }
  });

  this.command.on(COMMAND_MAPS[COMMANDS.NO_JOB], function (msg) {
    DEBUG && console.warn('Worker : CMD_NO_JOB');
  });

  this.command.on(COMMAND_MAPS[COMMANDS.ERROR], function (msg) {
    DEBUG && console.error('Command Error : %J', msg);
  });
}

util.inherits(Worker, Base);


/**
 * Regist a worker
 * @method regist
 * @param {Object} [params] a parameters.
 * @param {String} [params.ns] a namespace.
 * @param {String} [params.func] a function name.
 * @param {Object} [params.args] a function arguments.
 * @param {Function} callback a callback function.
 * @throws {Error}
 */
Worker.prototype.regist = function (params, cb) {

  // check connect.
  if (!this.socket) {
    throw new Error('Not Connect');
  }
  // check parameters.
  var func = params.func;
  if (!params || !params.func || (typeof(params.func) !== 'string') ||
      (params.func === '') || !cb || (typeof(cb) !== 'function')) {
    throw new Error('Invalid Parameter');
  }

  var ns;
  if (!params.ns || (typeof(params.ns) !== 'string')) {
    ns = '/';
  } else {
    var match = common.REGEX_NS.exec(params.ns);
    ns = (!match ? '/' : match[1]);
  }

  var cb_key = format('%s%s', ns, func);
  if (this.regist_cbs[cb_key]) {
    throw new Error('Already regist');
  }
  this.regist_cbs[cb_key] = cb;

  var req = {
    cmd: COMMANDS.REGIST_WORKER,
    params: {
      ns: ns,
      func: func
    }
  };
  this.socket.write(this.frmpsr.shrink([this.msgpsr.pack(req)]));

  return this;
};

Worker.prototype.disconnect = function (cb) {
  Base.prototype.disconnect.call(this, cb);
  var self = this;
  Object.keys(this.regist_cbs).forEach(function (key) {
    delete self.regist_cbs[key];
  });
};

//
// export(s)
//

module.exports = {
  Worker: Worker
};

