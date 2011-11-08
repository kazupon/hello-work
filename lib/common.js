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


// 
// export(s)
//

module.exports =  {
  // constant
  REGEX_NS: /^\/(.+\/?)*$/,
  //  class
  Job: Job,
  // command constant(s)
  CMD_JOIN: 1,
  CMD_LEAVE: 2
};

