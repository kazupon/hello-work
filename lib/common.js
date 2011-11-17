/**
 * common.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

// 
// import(s)
//
var EventEmitter = require('events').EventEmitter;
var util = require('util');


// 
// class(es)
//

function Job () {
  EventEmitter.call(this);
}
util.inherits(Job, EventEmitter);


function Message () {
}

Message.prototype.pack = function (data) {
  return JSON.stringify(data);
};

Message.prototype.unpack = function (data) {
  return JSON.parse(data);
}


function FrameParser () {
  this.demiliter = arguments[0] || '\n';
}

FrameParser.prototype.shrink = function (frames) {
  if (!frames || !Array.isArray(frames)) {
    return null;
  }
  var buf = '';
  for (var i = 0, len = frames.length; i < len; ++i) {
    buf += frames[i];
    buf += this.demiliter;
  }
  return new Buffer(buf);
};

FrameParser.prototype.expand = function (data) {
  if (!data || data.constructor.name !== 'Buffer') {
    return null;
  }
  var a = [];
  var buf = '';
  for (var i = 0, len = data.length; i < len; ++i) {
    var char = String.fromCharCode(data[i]);
    if (char === this.demiliter) {
      a.push(buf);
      buf = '';
    } else {
      buf += char;
    }
  }
  return a;
};


// 
// export(s)
//

module.exports =  {
  // constant
  //REGEX_NS: /^\/(.+\/?)*$/, // /(\/.*\/)*/
  REGEX_NS: /^(\/.*\/)*$/,
  //  class
  Job: Job,
  Message: Message,
  FrameParser: FrameParser,
  // command constant(s)
  CMD_JOIN: 1,
  CMD_LEAVE: 2,
  CMD_SUBMIT_JOB: 3,
  CMD_CREATED_JOB: 4,
  CMD_COMPLETE_JOB: 5,
  CMD_REGIST_WORKER: 6,
  CMD_COMMING_JOB: 7,
  CMD_GET_JOB: 8,
  CMD_NO_JOB: 9,
  CMD_ASSIGNED_JOB: 10,
  CMD_FAILED_JOB: 11,
  CMD_TIMEOUT_JOB: 12,
};

