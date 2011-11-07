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


//
// class(es)
//

function Worker () {
  Base.call(this);
  this.type = 'worker';
}
util.inherits(Worker, Base);


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

