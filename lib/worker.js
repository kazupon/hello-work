/**
 * worker.js
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
// class(es)
//

function Worker () {

  Base.call(this);
  this.type = 'worker';

  this.onCommand = function (res) {
    switch (res.cmd) {
      case common.CMD_REGIST_WORKER:
        if (res.stat !== 'OK') {
          self.emit('error', new Error('Not Expected Error'));
        }
        break;
      default:
        self.emit('error', new Error('Unknown Command Error'));
        break;
    }
  };

}

util.inherits(Worker, Base);


/**
 * Regist a worker,
 * @method regist
 * @param {Object} [params] a parameters.
 * @param {String} [params.ns] a namespace.
 * @param {String} [params.func] a function name.
 * @param {Object} [params.args] a function arguments.
 * @param {Function} callback a callback function.
 * @throws Error
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
  if (params.ns !== undefined) {
    if ((typeof(params.ns) !== 'string') || (params.ns === '') || 
        !common.REGEX_NS.test(params.ns)) {
      throw new Error('Invalid Parameter');
    }
  } else {
    params.ns = '/';
  }

  this.callback = callback;

  var ns = params.ns;
  var func = params.func;
  var req = {
    cmd: common.CMD_REGIST_WORKER,
    params: {
      ns: ns,
      func: func
    }
  };
  this.socket.write(this.frmpsr.shrink([this.msg.pack(req)]));
};


//
// export(s)
//

module.exports = {
  Worker: Worker
};

