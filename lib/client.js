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


//
// constant(s)
//


//
// clsss(es)
//

function Client () {
  Base.call(this);
  this.type = 'client';
}
util.inherits(Client, Base);


Client.prototype.do = function (params) {
  // checkk connect.
  if (!this.socket) {
    return null;
  }
  // check parameter.
  if (!params || !params.func || 
      (typeof(params.func) !== 'string') || params.func === '') {
    return null;
  }
  
  return new Task();
};


function Task () {
  EventEmitter.call(this);
}
util.inherits(Task, EventEmitter);


//
// export(s)
//

module.exports = {
  Client: Client,
  Task: Task
};

