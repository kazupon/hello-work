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
        var ret = false;
        try {
          client.do({
            func: 'add',
            args: { a: 2, b: 2 }
          }, function (job) {
          });
        } catch (e) {
          ret = true;
        }
        return ret;
      },
      '`do` method should `occur`': function (topic) {
        assert.ok(topic);
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
        return function (options, callback) {
          var ret = false;
          try {
            client.do(options, callback);
          } catch (e) {
            ret = true;
          }
          return ret;
        };
      },
      'with specify `all` options': {
        topic: function (parent) {
          return parent({
            ns: '/hoge', func: 'add', args: { a: 1, b: 1 }, timeout: 1000,
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `ns` abbrev options': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 1 }, timeout: 1000,
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `func` abbrev options': {
        topic: function (parent) {
          return parent({
            ns: '/hoge', args: { a: 1, b: 1 }, timeout: 1000,
          }, function (job) {
          });
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `args` abbrev options': {
        topic: function (parent) {
          return parent({
            ns: '/hoge', func: 'add', timeout: 1000
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `timeoute` abbrev options': {
        topic: function (parent) {
          return parent({
            ns: '/hoge', func: 'add', args: { a: 1, b: 1 },
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `callback` only': {
        topic: function (parent) {
          return parent(undefined, function (job) {
          });
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `none`': {
        topic: function (parent) {
          return parent();
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `number` ns illegale option': {
        topic: function (parent) {
          return parent({
            ns: 0, func: 'add', args: { a: 1, b: 1 }
          }, function (job) {
          });
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `null` ns illegale option': {
        topic: function (parent) {
          return parent({
            ns: null, func: 'add', args: { a: 1, b: 1 }
          }, function (job) {
          });
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `object` ns illegale option': {
        topic: function (parent) {
          return parent({
            ns: {}, func: 'add', args: { a: 1, b: 1 }
          }, function (job) {
          });
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `empty string` ns illegale option': {
        topic: function (parent) {
          return parent({
            ns: '', func: 'add', args: { a: 1, b: 1 }
          }, function (job) {
          });
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `not path string` ns illegale option': {
        topic: function (parent) {
          return parent({
            ns: 'hello', func: 'add', args: { a: 1, b: 1 }
          }, function (job) {
          });
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `sub path string` ns option': {
        topic: function (parent) {
          return parent({
            ns: '/hoge/foo', func: 'add', args: { a: 1, b: 1 }
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `number` func illegale option': {
        topic: function (parent) {
          return parent({
            func: 32, args: { a: 1, b: 1 }
          }, function (job) {
          });
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `null` func illegale option': {
        topic: function (parent) {
          return parent({
            func: null, args: { a: 1, b: 1 }
          });
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `object` func illegale option': {
        topic: function (parent) {
          return parent({
            func: {}, args: { a: 1, b: 1 }
          }, function (job) {
          });
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `empty string` func illegale option': {
        topic: function (parent) {
          return parent({
            func: '', args: { a: 1, b: 1 }
          }, function (job) {
          });
        },
        '`do` method should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `number` args option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: 22
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `null` args option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: null 
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `empty object` args option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: {}
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `string` args option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: 'hello'
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `function` args option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: function () { console.log('hoge'); }
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `negative number` timeout illegale option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: -10
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `float number` timeout option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: 10.00
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `null` timeout illegale option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: null
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `object` timeout illegale option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: {}
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `string` timeout illegale option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: 'hoge'
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `function` timeout illegale option': {
        topic: function (parent) {
          return parent({
            func: 'add', args: { a: 1, b: 2 }, timeout: function () {}
          }, function (job) {
          });
        },
        '`do` method should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
    },
  }
})).addBatch(whenServerRunning(20000, {
  'call `do`,': {
    topic: function () {
      return function (options) {
        return emitter(function (promise) {
          var client = new Client();
          client.connect(function (err) {
            if (!err) {
              client.do(options, function (job) {
                console.log('test `do` callback : %j', job);
                promise.emit('success', job);
              });
            }
          });
        });
      };
    },
    'with specify `normal`': {
      topic: function (parent) {
        return parent({
          func: 'add_normal', args: { a: 1, b: 1 }
        });
      },
      'should returned `Job` object by callback': function (topic) {
        assert.instanceOf(topic, Job);
      },
      /*
      ', callback `complete`': {
        topic: function (job) {
          return emitter(function (promise) {
            job.on('complete', function (res) {
              promise.emit('success', res);
            });
          });
        },
        'should returned `res` object': function (topic) {
          assert.ok(topic);
        },
        'should be `2` result': function (topic) {
          assert.equal(topic.result, 2);
        },
      }
      */
    },
  }
})).export(module);

