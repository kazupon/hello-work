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


//
// test(s)
//

var suite = vows.describe('agent.js tests');
suite.addBatch({
  'call `start`': {
    'with a specific port `20000`': {
      topic: function () {
        var agent = new Agent();
        agent.start(20000, this.callback);
        return agent;
      },
      'should be callback': function (topic) {
        assert.isUndefined(topic);
      },
    },
  },
  'call `stop`': {
    topic: function () {
      var agent = new Agent();
      var self = this;
      agent.start(20001, function () {
        agent.on('stop', self.callback);
        agent.stop();
      });
    },
    'should be callback': function (topic) {
      assert.isUndefined(topic);
    },
  },
  /*
  '`error`': {
    topic: function () {
      var port = 20002;
      var server = net.createServer();
      var self = this;
      server.listen(port, function () {
        var agent = new Agent();
        agent.on('error', self.callback);
        agent.start(port);
      });
    },
    'should be callback': function (topic) {
      assert.isUndefined(topic);
      assert.isObject(topic);
    },
  },
  */
}).export(module);

