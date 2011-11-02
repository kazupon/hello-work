/**
 * test-worker.js
 * @fileoverview worker.js tests
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var vows = require('vows');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var Agent = require('../lib/agent').Agent;
var Worker = require('../lib/worker').Worker;


// 
// test(s)
// 

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
    agent.stop(function () {
      console.log('... stop hellowork server');
    });
  };
  top_context['When `hellowork` server running,'] = top_context_properties;
  return top_context;
}


var suite = vows.describe('worker.js tests');
suite.addBatch({
  'A `Worker` instacne': {
    topic: new Worker(),
    'should `not have` host property': function (topic) {
      assert.isUndefined(topic.host);
    },
    'should `not have` port property': function (topic) {
      assert.isUndefined(topic.port);
    },
  },
}).export(module);
