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


//
// class(es)
//

function Worker (options) {
  EventEmitter.call(this);
  throw new Error('Not Implemented');
}

util.inherits(Worker, EventEmitter);


Worker.prototype.connect = function (options, callback) {
  throw new Error('Not Implemented');
};

Worker.prototype.disconnect = function (options, callback) {
  throw new Error('Not Implemented');
};

Worker.prototype.regist = function (params, callback) {
  throw new Error('Not Implemented');
};

function Job () {
  EventEmitter.call(this);
  throw new Error('Not Implemented');
}


//
// export(s)
//

module.exports.Worker = Worker;

