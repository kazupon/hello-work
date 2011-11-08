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

function Client () {
  Base.call(this);
  this.type = 'client';
}
util.inherits(Client, Base);


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
  if (params.ns !== undefined) {
    if ((typeof(params.ns) !== 'string') || (params.ns === '') || 
        !common.REGEX_NS.test(params.ns)) {
      throw new Error('Invalid Parameter');
    }
  }
  
  return new Job();
};


//
// export(s)
//

module.exports = {
  Client: Client
};

