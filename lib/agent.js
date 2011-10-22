/**
 * agent.js
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

function Agent () {
  EventEmitter.call(this);
}

util.inherits(Agent, EventEmitter);


//
// export(s)
//

module.exports.Agent = Agent;

