/**
 * worker.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var util = require('util');
var net = require('net');
var EventEmitter = require('./util').EventEmitter;
var Base = require('./base').Base;
var common = require('./common');
var COMMANDS = common.COMMANDS;
var Job = common.Job;


//
// class(es)
//

function Worker () {

  Base.call(this);
  this.type = 'worker';

  var self = this;
  this.onCommand = function (res) {
    var frmpsr = self.frmpsr;
    var msgpsr = self.msgpsr;
    var socket = self.socket;
    var cb = self.callback;
    switch (res.cmd) {
      case COMMANDS.REGIST_WORKER:
        if (res.stat !== 'OK') {
          self.soonEmit('error', new Error('Not Expected Error'));
        }
        break;
      case COMMANDS.COMMING_JOB:
        var req = {
          cmd: COMMANDS.GET_JOB
        };
        socket.write(frmpsr.shrink([msgpsr.pack(req)]));
        break;
      case COMMANDS.ASSIGNED_JOB:
        var job = new Job();
        job.id = res.job.id;
        job.args = res.job.args;
        var ret;
        var cmd;
        try {
          ret = cb(job);
          cmd = COMMANDS.COMPLETE_JOB;
        } catch (e) {
          ret = { message: e.message, code: e.code};
          cmd = COMMANDS.FAILED_JOB;
        }
        var req = {
          cmd: cmd,
          job: {
            id: job.id,
            result: ret
          }
        };
        socket.write(frmpsr.shrink([msgpsr.pack(req)]));
        break;
      case COMMANDS.NO_JOB:
        console.log('Worker : CMD_NO_JOB');
        break;
      default:
        self.soonEmit('error', new Error('Unknown Command Error'));
        break;
    }
  };

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
Worker.prototype.regist = function (params, callback) {

  // check connect.
  if (!this.socket) {
    throw new Error('Not Connect');
  }

  // check parameters.
  if (!params || !params.func || (typeof(params.func) !== 'string') ||
      (params.func === '') || !callback || (typeof(callback) !== 'function')) {
    throw new Error('Invalid Parameter');
  }
  var ns;
  if (!params.ns || (typeof(params.ns) !== 'string')) {
    ns = '/';
  } else {
    var match = common.REGEX_NS.exec(params.ns);
    ns = (!match ? '/' : match[1]);
  }

  this.callback = callback;

  var func = params.func;
  var req = {
    cmd: COMMANDS.REGIST_WORKER,
    params: {
      ns: ns,
      func: func
    }
  };
  this.socket.write(this.frmpsr.shrink([this.msgpsr.pack(req)]));
};


//
// export(s)
//

module.exports = {
  Worker: Worker
};

