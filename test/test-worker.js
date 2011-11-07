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
    'should be `not null`': function (topic) {
      assert.ok(topic);
    },
    'should be `null` host property': function (topic) {
      assert.isNull(topic.host);
    },
    'should be `null` port property': function (topic) {
      assert.isNull(topic.port);
    },
    'should be `worker` type property': function (topic) {
      assert.equal(topic.type, 'worker');
    },
  },
}).export(module);
