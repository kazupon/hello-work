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


//
// clsss(es)
//

function Client (options) {
  EventEmitter.call(this);
  throw new Error('Not Implemented');
}

util.inherits(Client, EventEmitter);


Client.prototype.connect = function (options, callback) {
  throw new Error('Not Implemented');
};

Client.prototype.disconnect = function (options, callback) {
  throw new Error('Not Implemented');
};

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
