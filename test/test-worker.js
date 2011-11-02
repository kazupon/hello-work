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
var whenServerRunning = require('./helper').whenServerRunning;


// 
// test(s)
// 

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
