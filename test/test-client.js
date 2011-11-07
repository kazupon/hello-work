/**
 * test-client.js
 * @fileoverview client.js tests
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var vows = require('vows');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var Agent = require('../lib/agent').Agent;
var Client = require('../lib/client').Client;
var whenServerRunning = require('./helper').whenServerRunning;


// 
// test(s)
// 

function callConnect () {
  return function (options) {
    var ret = {};
    var callback = true;
    if (arguments[1]) {
      callback = arguments[1];
    }
    var promise = new EventEmitter();
    var client = new Client();
    ret.count = 0;
    var onEmit = function (err) {
      ret.client = client;
      ret.count++;
      process.nextTick(function () {
        err ? promise.emit('error', err, ret) : promise.emit('success', ret);
      });
    };
    client.on('connect', onEmit);
    var args = [];
    if (options) {
      args.push(options);
    }
    args.push((callback ? onEmit : undefined));
    client.connect.apply(client, args);
    return promise;
  };
}


var suite = vows.describe('client.js tests');
suite.addBatch({
  'A `Client` instacne': {
    'should be `not null`': function (topic) {
      assert.ok(topic);
    },
    topic: new Client(),
    'should be `null` host property': function (topic) {
      assert.isNull(topic.host);
    },
    'should be `null` port property': function (topic) {
      assert.isNull(topic.port);
    },
    'should be `client` type property': function (topic) {
      assert.equal(topic.type, 'client');
    },
  },
}).export(module);
