/**
 * client.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var util = require('util');
var net = require('net');
var common = require('./common');
var COMMANDS = common.COMMANDS;
var COMMAND_MAPS = common.COMMAND_MAPS;
var Job = common.Job;
var Base = require('./base').Base;


//
// constant(s)
//

var NUMBER_MAX = 9007199254740991;


//
// clsss(es)
//

/**
 * helloworld client class.
 * @class Client
 * @constructor
 */
function Client () {

  Base.call(this);
  this.type = 'client';
  this.jobs = {};
  this.seq = 0;
  this.do_callbacks = {};

  var self = this;

  //
  // command handlers
  //
  this.command.on(COMMAND_MAPS[COMMANDS.CREATED_JOB], function (msg) {
    var job = new Job();
    job.id = msg.job.id;
    job.ns = msg.job.ns;
    job.func = msg.job.func;
    self.jobs[job.id] = job;
    var callback = self.do_callbacks[msg.seq];
    if (callback) {
      callback(job);
      delete self.do_callbacks[msg.seq];
    }
  });

  this.command.on(COMMAND_MAPS[COMMANDS.ASSIGNED_JOB], function (msg) {
    var job = self.jobs[msg.job.id];
    job.emit('processing');
  });

  this.command.on(COMMAND_MAPS[COMMANDS.COMPLETE_JOB], function (msg) {
    var job = self.jobs[msg.job.id];
    job.emit('complete', {
      result: msg.job.result
    });
    delete self.jobs[msg.job.id];
  });

  this.command.on(COMMAND_MAPS[COMMANDS.FAILED_JOB], function (msg) {
    var job = self.jobs[msg.job.id];
    job.soonEmit('fail', {
      err: new Error(msg.job.result.message)
    });
    delete self.jobs[msg.job.id];
  });

  //this.command.on(COMMAND_MAPS[COMMANDS.TIMEOUT_JOB], function (msg) {
  //  var job = self.jobs[msg.job.id];
  //  job.emit('timeout', {
  //    code: msg.job.code
  //  });
  //  delete self.jobs[msg.job.id];
  //});

}

util.inherits(Client, Base);


/**
 * Queueing a job.
 * @method do
 * @param {Object} [params] a parameters.
 * @param {String} [params.ns] a namespace.
 * @param {String} [params.func] a function name.
 * @param {Object} [params.args] a function arguments.
 * @param {Number} [params.timeout] a timeout milisecond.
 * @param {Function} callback a callback function.
 * @throws {Error}
 */
Client.prototype.do = function (params, callback) {

  // check connect.
  if (!this.socket) {
    throw new Error('Not Connect');
  }

  //check  parameter.
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

  if (this.seq === NUMBER_MAX) {
    this.seq = 0;
  }
  this.do_callbacks[++this.seq] = callback;

  var func = params.func;
  var args = (params.args && (typeof(params.args) === 'object')) ? params.args : null;
  var timeout = (params.timeout && (typeof(params.timeout) === 'number') && (params.timeout > 0)) ? params.timeout : 0;
  var req = {
    cmd: COMMANDS.SUBMIT_JOB,
    seq: this.seq,
    params: {
      ns: ns,
      func: func,
      args: args,
      timeout: timeout
    }
  };
  this.socket.write(this.frmpsr.shrink([this.msgpsr.pack(req)]));

  return this;
};


//
// export(s)
//

module.exports = {
  Client: Client
};

