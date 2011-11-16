/**
 * client.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var net = require('net');
var Base = require('./base').Base;
var common = require('./common');
var Job = require('./common').Job;


//
// clsss(es)
//

/**
 * Client class
 * @class Client
 * @constructor
 */
function Client () {

  Base.call(this);
  this.type = 'client';
  this.jobs = {};

  var self = this;
  this.onCommand = function (res) {
    switch (res.cmd) {
      case common.CMD_CREATED_JOB:
        var job = new Job();
        job.id = res.job.id;
        job.ns = res.job.ns;
        job.func = res.job.func;
        self.jobs[job.id] = job;
        self.callback(job);
        break;
      case common.CMD_COMPLETE_JOB:
        var job = self.jobs[res.job.id];
        job.emit('complete', {
          result: res.job.result
        });
        delete self.jobs[res.job.id];
        break;
      default:
        self.emit('error', new Error('Unknown Command Error'));
        break;
    }
  };

}

util.inherits(Client, Base);


/**
 * @method do
 * @param {Object} [params] a parameters.
 * @param {String} [params.ns] a namespace.
 * @param {String} [params.func] a function name.
 * @param {Object} [params.args] a function arguments.
 * @param {Number} [params.timeout] a timeout milisecond.
 * @param {Function} callback a callback function.
 * @throws Error
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

  this.callback = callback;

  var func = params.func;
  var args = (params.args && (typeof(params.args) === 'object')) ? params.args : null;
  var timeout = (params.timeout && (typeof(params.timeout) === 'number') && (params.timeout > 0)) ? params.timeout : 0;
  var req = {
    cmd: common.CMD_SUBMIT_JOB,
    params: {
      ns: ns,
      func: func,
      args: args,
      timeout: timeout
    }
  };
  this.socket.write(this.frmpsr.shrink([this.msg.pack(req)]));

};


//
// export(s)
//

module.exports = {
  Client: Client
};

