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
  
  var self = this;
  var socket = this.socket;
  var frmpsr = this.frmpsr;
  (function () {
    var job = new Job();
    var listener = function (data) {
      var frames = frmpsr.expand(data);
      if (!frames) {
        self.emit('error', new Error('Not Expected Error'));
        return;
      }
      frames.forEach(function (frame) {
        var res = JSON.parse(frame);
        switch (res.cmd) {
          case common.CMD_JOB_CREATED:
            job.id = res.job.id;
            callback(job);
            break;
          case common.CMD_COMPLETE_JOB:
            job.emit('complete', {
              result: result
            });
            socket.removeListener('data', listener);
            break;
          default:
            break;
        }
      }); // end of frames.forEach
    }; // end of listener
    socket.on('data', listener);

    var ns = params.ns;
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
    socket.write(frmpsr.shrink([JSON.stringify(req)]));
  })();

};


//
// export(s)
//

module.exports = {
  Client: Client
};

