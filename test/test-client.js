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
    topic: new Client(),
    'should `not have` host property': function (topic) {
      assert.isUndefined(topic.host);
    },
    'should `not have` port property': function (topic) {
      assert.isUndefined(topic.port);
    },
  },
}).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with specify `host`, `port` and `callback`,': {
      topic: function (parent) {
        return parent({
          host: 'localhost',
          port: 20000,
        });
      },
      'the connect event should occur `once`': function (topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Client instance should `have` host property': function (topic) {
        assert.equal(topic.client.host, 'localhost');
      },
      'a Client instance should `have` port property': function (topic) {
        assert.equal(topic.client.port, 20000);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call connect': {
    topic: callConnect,
    'with specify `host` and `callback`,': {
      topic: function (parent) {
        return parent({
          host: 'localhost',
        });
      },
      'the connect event should occur `once`': function (topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Client instance should `have` host property': function (topic) {
        assert.equal(topic.client.host, 'localhost');
      },
      'a Client instance should `have` port property': function (topic) {
        assert.equal(topic.client.port, 20000);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with specify `port` and `callback`,': {
      topic: function (parent) {
        return parent({
          port: 20000,
        });
      },
      'the connect event should occur `once`': function (topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Client instance should `have` host property': function (topic) {
        assert.equal(topic.client.host, 'localhost');
      },
      'a Client instance should `have` port property': function (topic) {
        assert.equal(topic.client.port, 20000);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with specify `port` and `host`': {
      topic: function (parent) {
        return parent({
          host: 'localhost',
          port: 20000,
        }, false);
      },
      'the connect event should occur `once`': function (topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Client instance should `have` host property': function (topic) {
        assert.equal(topic.client.host, 'localhost');
      },
      'a Client instance should `have` port property': function (topic) {
        assert.equal(topic.client.port, 20000);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with specify `none`': {
      topic: function (parent) {
        return parent();
      },
      'the connect event should occur `once`': function (topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Client instance should `have` host property': function (topic) {
        assert.equal(topic.client.host, 'localhost');
      },
      'a Client instance should `have` port property': function (topic) {
        assert.equal(topic.client.port, 20000);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with specify `callback` only': {
      topic: function (parent) {
        return parent();
      },
      'the connect event should occur `once`': function (topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Client instance should `have` host property': function (topic) {
        assert.equal(topic.client.host, 'localhost');
      },
      'a Client instance should `have` port property': function (topic) {
        assert.equal(topic.client.port, 20000);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with specify `0` port': {
      topic: function (parent) {
        return parent({
          port: 0,
        });
      },
      'the connect event should occur `once`': function (err, topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Client instance should `not have` host property': function (err, topic) {
        assert.isUndefined(topic.client.host);
      },
      'a Client instance should `not have` port property': function (err, topic) {
        assert.isUndefined(topic.client.port);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with specify `-1` port': {
      topic: function (parent) {
        return parent({
          port: -1,
        });
      },
      'the connect event should occur `once`': function (err, topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Client instance should `not have` host property': function (err, topic) {
        assert.isUndefined(topic.client.host);
      },
      'a Client instance should `not have` port property': function (err, topic) {
        assert.isUndefined(topic.client.port);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with specify `1024` port': {
      topic: function (parent) {
        return parent({
          port: 1024,
        });
      },
      'the connect event should occur `once`': function (err, topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Client instance should `not have` host property': function (err, topic) {
        assert.isUndefined(topic.client.host);
      },
      'a Client instance should `not have` port property': function (err, topic) {
        assert.isUndefined(topic.client.port);
      },
    },
  },
})).addBatch(whenServerRunning(1025, {
  'call `connect`': {
    topic: callConnect,
    'with specify `1025` port': {
      topic: function (parent) {
        return parent({
          port: 1025,
        });
      },
      'the connect event should occur `once`': function (topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Client instance should `have` host property': function (topic) {
        assert.equal(topic.client.host, 'localhost');
      },
      'a Client instance should `have` port property': function (topic) {
        assert.equal(topic.client.port, 1025);
      },
    },
  },
})).addBatch(whenServerRunning(32767, {
  'call `connect`': {
    topic: callConnect,
    'with specify `32767` port': {
      topic: function (parent) {
        return parent({
          port: 32767,
        });
      },
      'the connect event should occur `once`': function (topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Client instance should `have` host property': function (topic) {
        assert.equal(topic.client.host, 'localhost');
      },
      'a Client instance should `have` port property': function (topic) {
        assert.equal(topic.client.port, 32767);
      },
    },
  },
})).addBatch(whenServerRunning(65535, {
  'call `connect`': {
    topic: callConnect,
    'with specify `65535` port': {
      topic: function (parent) {
        return parent({
          port: 65535,
        });
      },
      'the connect event should occur `once`': function (topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Client instance should `have` host property': function (topic) {
        assert.equal(topic.client.host, 'localhost');
      },
      'a Client instance should `have` port property': function (topic) {
        assert.equal(topic.client.port, 65535);
      },
    },
  },
})).addBatch(whenServerRunning(65536, {
  'call `connect`': {
    topic: callConnect,
    'with specify `65536` port': {
      topic: function (parent) {
        return parent({
          port: 65536,
        });
      },
      'the connect event should occur `once`': function (err, topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Client instance should `not have` host property': function (err, topic) {
        assert.isUndefined(topic.client.host);
      },
      'a Client instance should `not have` port property': function (err, topic) {
        assert.isUndefined(topic.client.port);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with specify `localhost` host': {
      topic: function (parent) {
        return parent({
          host: 'localhost',
        });
      },
      'the connect event should occur `once`': function (topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Client instance should `have` host property': function (topic) {
        assert.equal(topic.client.host, 'localhost');
      },
      'a Client instance should `have` port property': function (topic) {
        assert.equal(topic.client.port, 20000);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with specify `hoge`(none) host': {
      topic: function (parent) {
        return parent({
          host: 'hoge',
        });
      },
      'the connect event should occur `once`': function (err, topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Client instance should `not have` host property': function (err, topic) {
        assert.isUndefined(topic.client.host);
      },
      'a Client instance should `not have` port property': function (err, topic) {
        assert.isUndefined(topic.client.port);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with specify `IP` host': {
      topic: function (parent) {
        return parent({
          host: '127.0.0.1',
        });
      },
      'the connect event should occur `once`': function (topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Client instance should `have` host property': function (topic) {
        assert.equal(topic.client.host, '127.0.0.1');
      },
      'a Client instance should `have` port property': function (topic) {
        assert.equal(topic.client.port, 20000);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: callConnect,
    'with illegal specify `0` host': {
      topic: function (parent) {
        return parent({
          host: '0',
        });
      },
      'the connect event should occur `once`': function (err, topic) {
        assert.equal(topic.count, 1);
      },
      'the connect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Client instance should `not have` host property': function (err, topic) {
        assert.isUndefined(topic.client.host);
      },
      'a Client instance should `not have` port property': function (err, topic) {
        assert.isUndefined(topic.client.port);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `connect`': {
    topic: function () {
      var promise = new EventEmitter();
      var client = new Client();
      client.connect(function (err) {
        process.nextTick(function () {
          err ? promise.emit('error', err, client)
              : promise.emit('success',client);
        });
      });
      return promise;
    },
    'and call `connect`': {
      topic: function (parent) {
        var promise = new EventEmitter();
        parent.connect(function (err) {
          process.nextTick(function () {
            err ? promise.emit('error', err, parent)
                : promise.emit('success', parent);
          });
        });
        return promise;
      },
      'the connect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Client instance should `have` host property': function (err, topic) {
        assert.equal(topic.host, 'localhost');
      },
      'a Client instance should `have` port property': function (err, topic) {
        assert.equal(topic.port, 20000);
      },
    },
  },
})).addBatch(whenServerRunning(20000, {
  'call `disconnect`': {
    topic: function () {
      var ret = {};
      var promise = new EventEmitter();
      var client = new Client();
      ret.client = client;
      ret.count = 0;
      client.connect(function (err) {
        client.disconnect(function (err) {
          ret.count++;
          process.nextTick(function () {
            err ? promise.emit('error', err, ret)
                : promise.emit('success', ret);
          });
        });
      });
      return promise;
    },
    'and call `disconnect`': {
      topic: function (parent) {
        var ret = {};
        var promise = new EventEmitter();
        var client = parent.client;
        ret.client = client;
        ret.count = parent.count;
        client.disconnect(function (err) {
          ret.count++;
          process.nextTick(function () {
            err ? promise.emit('error', err, ret)
                : promise.emit('success', ret);
          });
        });
        return promise;
      },
      'the disconnect event should occur `two`': function (err, topic) {
        assert.equal(topic.count, 2);
      },
      'the disconnect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      /*
      'a Client instance should `not have` host property': function (err, topic) {
        assert.isUndefined(topic.client.host);
      },
      'a Client instance should `not have` port property': function (err, topic) {
        assert.isUndefined(topic.client.port);
      },
      */
    },
    'the disconnect event should occur `once`': function (topic) {
      assert.equal(topic.count, 1);
    },
    'the disconnect event type should be `success`': function (err, topic) {
      assert.isNull(err);
    },
    'a Client instance should `not have` host property': function (topic) {
      assert.isUndefined(topic.client.host);
    },
    'a Client instance should `not have` port property': function (topic) {
      assert.isUndefined(topic.client.port);
    },
  },
})).export(module);
/*
})).addBatch({
  'when the `hellowork` server process do not run,': {
    'call `connect`': {
      topic: function () {
        return function (options) {
          var promise = new EventEmitter();
          var client = new Client();
          client.on('error', function (err) {
            promise.emit('error', err);
          });
          client.connect(options, function () {
            promise.emit('success');
          });
          return promise;
        };
      },
      'with specify `options`': {
        topic: function (parent) {
          parent({
            host: 'localhost',
            port: 20000,
          });
        },
        'should occur error': function (err) {
          assert.instanceOf(err, Error);
        },
      },
      'with specify `none`': {
        topic: function (parent) {
          parent();
        },
        'should occur error': function (err) {
          assert.instanceOf(err, Error);
        },
      },
    },
    'call `disconnect`': {
      topic: function () {
        var promise = new EventEmitter();
        var client = new Client();
        client.on('error', function (err) {
          promise.emit('error', err);
        });
        client.disconnect(function () {
          promise.emit('success');
        });
        return promise;
      },
      'should occur error': function (err) {
        assert.instanceOf(err, Error);
      },
    },
    'call `do`': {
      topic: function () {
        var promise = new EventEmitter();
        var client = new Client();
        client.on('error', function (err) {
          promise.emit('error', err);
        });
        var task = client.do({
          func: 'add',
          args: {
            a: 2,
            b: 2
          }
        });
        assert.ok(!task);
        return promise;
      },
      'should occur error': function (err) {
        assert.instanceOf(err, Error);
      },
    },
  },
}).export(module);
*/
