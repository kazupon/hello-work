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
}
util.inherits(Worker, Base);


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
  }

};


//
// export(s)
//

module.exports = {
  Worker: Worker
};

