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
  throw new Error('Not Implemented');
};


function Task () {
  EventEmitter.call(this);
  throw new Error('Not Implemented');
}

util.inherits(Task, EventEmitter);


//
// export(s)
//

exports.Client = Client;
