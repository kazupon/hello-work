/**
 * test-agent.js
 * @fileoverview agent.js tests
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
// 

var vows = require('vows');
var assert = require('assert');
var format = require('util').format;
var Agent = require('../lib/agent').Agent;
var net = require('net');
var emitter = require('./helper').emitter;


//
// test(s)
//

var suite = vows.describe('agent.js tests');
suite.addBatch({
  'call `start`': {
    'with a specific port `20000`': {
      topic: function () {
        return emitter(function (promise) {
          var agent = new Agent();
          agent.start(20000, function () {
            promise.emit('success');
          });
        });
      },
      'should be callback': function (topic) {
        assert.isUndefined(topic);
      },
    },
  },
  'call `stop`': {
    topic: function () {
      return emitter(function (promise) {
        var agent = new Agent();
        agent.start(20001, function () {
          agent.on('stop', function () {
            promise.emit('success');
          });
          agent.stop();
        });
      });
    },
    'should be callback': function (topic) {
      assert.isUndefined(topic);
    },
  },
}).export(module);

