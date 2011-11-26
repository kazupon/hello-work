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
var net = require('net');
var Agent = require('../lib/agent').Agent;
var Base = require('../lib/base').Base;
var emitter = require('./helper').emitter;


//
// test(s)
//

var suite = vows.describe('agent.js tests');
suite.addBatch({
  'when call `start` with specific port `20000`,': {
    topic: function () {
      var agent = new Agent();
      this.agent = agent;
      agent.start(20000, this.callback);
    },
    'should call callback': function (topic) {
      assert.isUndefined(topic);
    },
    'call `stop`': {
      topic: function () {
        var agent = this.agent;
        agent.stop(this.callback);
      },
      'should call callback': function (topic) {
        assert.isUndefined(topic);
      },
    },
  },
}).addBatch({
  'when call `start` specific port `20000`,': {
    topic: function () {
      var agent = new Agent();
      this.agent = agent;
      agent.start(20000, this.callback);
    },
    'call `start` with specific port `20000`,': {
      topic: function () {
        var agent = this.agent;
        agent.on('error', this.callback);
        agent.start(20000);
      },
      'should occur `error` event': function (err, topic) {
        assert.instanceOf(err, Error);
        assert.isUndefined(topic);
      },
      teardown: function (topic) {
        var agent = this.agent;
        agent.stop();
      },
    },
  },
}).addBatch({
  'when `start` event handle with `on`, call `start`,': {
    topic: function () {
      var agent = new Agent();
      this.agent = agent;
      agent.on('start', this.callback);
      agent.start(33333);
    },
    'should occur `start` event': function (topic) {
      assert.isUndefined(topic);
    },
    '`stop` event handle with `on`, call `stop`': {
      topic: function () {
        var agent = this.agent;
        agent.on('stop', this.callback);
        agent.stop();
      },
      'should occur `stop` event': function (topic) {
        assert.isUndefined(topic);
      },
    },
  },
}).addBatch({
  'when there are connected client(s),': {
    topic: function () {
      var agent = new Agent();
      var base = new Base();
      this.agent = agent;
      this.client = base;
      var port = 20002;
      var self = this;
      agent.start(port, function (err) {
        console.log('agent start ...');
        base.connect({ port: port }, self.callback);
      });
    },
    'call `stop`': {
      topic: function (err) {
        var agent = this.agent; 
        agent.on('stop', this.callback);
        agent.stop();
        console.log('aget stop ...');
      },
      'should be callback': function (topic) {
        assert.isUndefined(topic);
      },
    }
  },
}).export(module);

