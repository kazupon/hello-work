/**
 * common.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

// 
// import(s)
//

var EventEmitter = require('./util').EventEmitter;
var util = require('util');


//
// constant(s)
//

var COMMANDS = {
  JOIN: 1,
  LEAVE: 2,
  SUBMIT_JOB: 3,
  CREATED_JOB: 4,
  COMPLETE_JOB: 5,
  REGIST_WORKER: 6,
  COMMING_JOB: 7,
  GET_JOB: 8,
  NO_JOB: 9,
  ASSIGNED_JOB: 10,
  FAILED_JOB: 11,
  TIMEOUT_JOB: 12,
  ERROR: 64
};

var COMMAND_MAPS = {};
Object.keys(COMMANDS).forEach(function (key) {
  COMMAND_MAPS[COMMANDS[key]] = key;
});

var DEBUG = (process.env.NODE_ENV !== 'production');


// 
// class(es)
//

function Job () {
  EventEmitter.call(this);
}
util.inherits(Job, EventEmitter);


function MessageParser () {
}

MessageParser.prototype.pack = function (data) {
  return JSON.stringify(data);
};

MessageParser.prototype.unpack = function (data) {
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

FrameParser.prototype.expand = function (/*data, callback */) {
  var data = arguments[0];
  var callback = arguments[1];
  if (!data || data.constructor.name !== 'Buffer') {
    return [];
  }
  var a = [];
  var buf = '';
  for (var i = 0, len = data.length; i < len; ++i) {
    var char = String.fromCharCode(data[i]);
    if (char === this.demiliter) {
      if (buf.length > 0) {
        callback && callback(buf);
        a.push(buf);
      }
      buf = '';
    } else {
      buf += char;
    }
  }
  return a;
};


function debug (/* args */) {
  util.format(util.format.apply(this, arguments));
}
if (!console.debug) {
  console.debug = debug;
}

// 
// export(s)
//

module.exports =  {
  // constant
  //REGEX_NS: /^\/(.+\/?)*$/, // /(\/.*\/)*/
  REGEX_NS: /^(\/.*\/)*$/,
  DEBUG: DEBUG,
  //  class
  Job: Job,
  MessageParser: MessageParser,
  FrameParser: FrameParser,
  // command constant(s)
  COMMANDS: COMMANDS,
  COMMAND_MAPS: COMMAND_MAPS
};

