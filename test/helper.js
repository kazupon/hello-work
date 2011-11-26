/**
 * helper.js
 * @fileoverview helper libraries
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//
var EventEmitter = require('events').EventEmitter;
var Agent = require('../lib/agent').Agent;

var promiser = function () {
  var args = arguments;
  return function () {
    var promise = new EventEmitter();
    process.nextTick(function () {
      promise.emit.apply(promise, args);
    });
    return promise;
  }
};

var emitter = function (callback) {
  var promise = new EventEmitter();
  process.nextTick(function () {
    callback(promise);
  });
  return promise;
};

function whenServerRunning (port, target) {
  var top_context = {};
  var top_context_properties = {};
  top_context_properties.topic = function () {
    var agent = new Agent();
    agent.start(port, function () {
      console.log('start hellowork server ...');
    });
    return agent;
  };
  Object.keys(target).forEach(function (context) {
    top_context_properties[context] = target[context];
  });
  top_context_properties.teardown = function (agent) {
      var cb = this.callback;
      agent.on('stop', function () {
        console.log('... stop hellowork server');
        cb();
      });
      agent.stop();
  };
  top_context['When `hellowork` server running,'] = top_context_properties;
  return top_context;
}


module.exports = {
  whenServerRunning: whenServerRunning,
  promiser: promiser,
  emitter: emitter
};

