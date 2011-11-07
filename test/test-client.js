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
var Job = require('../lib/common').Job;
var whenServerRunning = require('./helper').whenServerRunning;
var promiser = require('./helper').promiser;
var emitter = require('./helper').emitter;


// 
// test(s)
// 

function callDo() {
  return function (options) {
    var ret = {};
    var promise = new EventEmitter();
    var client = new Client();
    var onEmit = function (err) {
      ret.client = client;
      process.nextTick(function () {
        err ? promise.emit('error', err, ret) : promise.emit('success', ret);
      });
    };
    client.on('connect', onEmit);
    var args = [];
    if (options) {
      args.push(options);
    }
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
}).addBatch({
  'When not connect to server,': {
    topic: new Client(),
    'call `do`,': {
      topic: function (client) {
        return client.do({
          func: 'add',
          args: { a: 2, b: 2 }
        });
      },
      '`do` method should returned `null`': function (topic) {
        assert.isNull(topic);
      },
    },
  },
}).addBatch(whenServerRunning(20000, {
  'check parameter,': {
    topic: emitter(function (promise) {
      var client = new Client();
      client.connect(function (err) {
        err ? promise.emit('error', err) : promise.emit('success', client);
      });
    }),
    'call `do`': {
      topic: function (client) {
        return function (options) {
          return client.do(options);
        };
      },
      'with specify `all` options': {
        topic: function (parent) {
          return parent({
            ns: '/hoge', func: 'add', args: { a: 1, b: 1 }, timeout: 1000
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `ns` abbrev options': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 1 }, timeout: 1000
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `func` abbrev options': {
        topic: function (parent) {
          return parent({
            ns: '/hoge', args: { a: 1, b: 1 }, timeout: 1000
          });
        },
        '`do` method should returned `null`': function (topic) {
          assert.isNull(topic);
        },
      },
      'with specify `args` abbrev options': {
        topic: function (parent) {
          return parent({
            ns: '/hoge', func: 'add', timeout: 1000
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `timeoute` abbrev options': {
        topic: function (parent) {
          return parent({
            ns: '/hoge', func: 'add', args: { a: 1, b: 1 }
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `none`': {
        topic: function (parent) {
          return parent();
        },
        '`do` method should returned `null`': function (topic) {
          assert.isNull(topic);
        },
      },
      'with specify `number` ns illegale option': {
        topic: function (parent) {
          return parent({
            ns: 0, func: 'add', args: { a: 1, b: 1 }
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `null` ns illegale option': {
        topic: function (parent) {
          return parent({
            ns: null, func: 'add', args: { a: 1, b: 1 }
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `object` ns illegale option': {
        topic: function (parent) {
          return parent({
            ns: {}, func: 'add', args: { a: 1, b: 1 }
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `empty string` ns illegale option': {
        topic: function (parent) {
          return parent({
            ns: '', func: 'add', args: { a: 1, b: 1 }
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `not path string` ns illegale option': {
        topic: function (parent) {
          return parent({
            ns: 'hello', func: 'add', args: { a: 1, b: 1 }
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `sub path string` ns option': {
        topic: function (parent) {
          return parent({
            ns: '/hoge/foo', func: 'add', args: { a: 1, b: 1 }
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `number` func illegale option': {
        topic: function (parent) {
          return parent({
            func: 32, args: { a: 1, b: 1 }
          });
        },
        '`do` method should returned `null`': function (topic) {
          assert.isNull(topic);
        },
      },
      'with specify `null` func illegale option': {
        topic: function (parent) {
          return parent({
            func: null, args: { a: 1, b: 1 }
          });
        },
        '`do` method should returned `null`': function (topic) {
          assert.isNull(topic);
        },
      },
      'with specify `object` func illegale option': {
        topic: function (parent) {
          return parent({
            func: {}, args: { a: 1, b: 1 }
          });
        },
        '`do` method should returned `null`': function (topic) {
          assert.isNull(topic);
        },
      },
      'with specify `empty string` func illegale option': {
        topic: function (parent) {
          return parent({
            func: '', args: { a: 1, b: 1 }
          });
        },
        '`do` method should returned `null`': function (topic) {
          assert.isNull(topic);
        },
      },
      'with specify `number` args option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: 22
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `null` args option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: null 
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `empty object` args option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: {}
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `string` args option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: 'hello'
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `function` args option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: function () { console.log('hoge'); }
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `negative number` timeout illegale option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: -10
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `float number` timeout option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: 10.00
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `null` timeout illegale option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: null
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `object` timeout illegale option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: {}
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `string` timeout illegale option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: 'hoge'
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
      'with specify `function` timeout illegale option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: function () {}
          });
        },
        '`do` method should returned a `Job` object': function (topic) {
          assert.instanceOf(topic, Job);
        },
      },
    },
  }
})).export(module);
