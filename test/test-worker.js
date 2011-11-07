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
var Job = require('../lib/worker').Job;
var whenServerRunning = require('./helper').whenServerRunning;
var emitter = require('./helper').emitter;


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
}).addBatch({
  'When not connect to server,': {
    topic: new Worker (),
    'call `regist`,': {
      topic: function (worker) {
        var ret;
        try {
          worker.regist({ func: 'add' }, function (job) {
            console.log(job);
          });
        } catch (e) {
          ret = e;
        }
        return ret;
      },
      '`regist` method should occur `error`': function (topic) {
        assert.instanceOf(topic, Error);
      },
    },
  },
}).addBatch(whenServerRunning(20000, {
  'check parameter,': {
    topic: emitter(function (promise) {
      var worker = new Worker();
      worker.connect(function (err) {
        err ? promise.emit('error', err) : promise.emit('success', worker);
      });
    }),
    'call `regist`': {
      topic: function (worker) {
        return function (options, callback) {
          var ret = false;
          try {
            worker.regist(options, callback);
          } catch (e) {
            ret = true;
          }
          return ret;
        };
      },
      'with specify `all` options': {
        topic: function (parent) {
          return parent({ ns: '/hoge', func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        '`regist` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `ns` abbrev options': {
        topic: function (parent) {
          return parent({ func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        '`regist` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `func` abbrev options': {
        topic: function (parent) {
          return parent({ ns: '/' }, function (job) {
            console.log('hoge');
          });
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `callback` abbrev options': {
        topic: function (parent) {
          return parent({ func: 'add' });
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `none` option': {
        topic: function (parent) {
          return parent();
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `number` ns illegale option': {
        topic: function (parent) {
          return parent({ ns: 2, func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `null` ns illegale option': {
        topic: function (parent) {
          return parent({ ns: null, func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `object` ns illegale option': {
        topic: function (parent) {
          return parent({ ns: {}, func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `empty string` ns illegale option': {
        topic: function (parent) {
          return parent({ ns: '', func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `not path string` ns illegale option': {
        topic: function (parent) {
          return parent({ ns: 'hoge', func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `sub path string` ns option': {
        topic: function (parent) {
          return parent({ ns: '/hoge/hoge', func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        '`regist` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `number` func illegale option': {
        topic: function (parent) {
          return parent({ func: 'add' }, 1);
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `null` func illegale option': {
        topic: function (parent) {
          return parent({ func: 'add' }, null);
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `object` func illegale option': {
        topic: function (parent) {
          return parent({ func: 'add' }, {});
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `empty string` func illegale option': {
        topic: function (parent) {
          return parent({ func: 'add' }, '');
        },
        '`regist` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
    },
  },
})).export(module);
