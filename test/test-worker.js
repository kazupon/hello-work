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
var Client = require('../lib/client').Client;
var Worker = require('../lib/worker').Worker;
var Job = require('../lib/common').Job;
var whenServerRunning = require('./helper').whenServerRunning;
var emitter = require('./helper').emitter;


// 
// test(s)
// 
//
function whenSubmitJob (target) {
  var top_context = {};
  var top_context_properties = {};
  var agent;
  var client;
  top_context_properties.topic = function () {
    return function (opts) {
      return emitter(function (promise) {
        try {
          agent = new Agent();
          agent.start(20000, function () {
            console.log('agent start ...');
            client = new Client();
            console.log('client connect ...');
            client.connect(function (err) {
              try {
                if (err) {
                  promise.emit('error', err);
                  return;
                }
                if (opts) {
                  var cb = opts.cb || true;
                  if (cb) {
                    client.do(opts, function (job) {
                      promise.emit('success', job);
                    });
                  } else {
                    client.do(opts);
                  }
                } else {
                  client.do();
                }
              } catch (e) {
                promise.emit('error', e);
              }
            });
          });
        } catch (e) {
          promise.emit('error', e);
        }
      });
    };
  };
  Object.keys(target).forEach(function (context) {
    top_context_properties[context] = target[context];
  });
  top_context_properties.teardown = function (topic) {
    try {
      process.nextTick(function () {
        client.disconnect(function (err) {
          console.log('... disconnect client');
        });
      });
      process.nextTick(function () {
        agent.stop(function (err) {
          console.log('... stop agent');
        });
      });
    } catch (e) {
      console.error(e.message);
    }
  };
  top_context[''] = top_context_properties;
  return top_context;
}

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
      'should occur `error`': function (topic) {
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
        'should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `ns` abbrev options': {
        topic: function (parent) {
          return parent({ func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        'should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `func` abbrev options': {
        topic: function (parent) {
          return parent({ ns: '/' }, function (job) {
            console.log('hoge');
          });
        },
        'should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `callback` abbrev options': {
        topic: function (parent) {
          return parent({ func: 'add' });
        },
        'should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `none` option': {
        topic: function (parent) {
          return parent();
        },
        'should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `number` ns illegale option': {
        topic: function (parent) {
          return parent({ ns: 2, func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        'should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `null` ns illegale option': {
        topic: function (parent) {
          return parent({ ns: null, func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        'should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `object` ns illegale option': {
        topic: function (parent) {
          return parent({ ns: {}, func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        'should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `empty string` ns illegale option': {
        topic: function (parent) {
          return parent({ ns: '', func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        'should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `not path string` ns illegale option': {
        topic: function (parent) {
          return parent({ ns: 'hoge', func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        'should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `sub path string` ns option': {
        topic: function (parent) {
          return parent({ ns: '/hoge/hoge', func: 'add' }, function (job) {
            console.log('hoge');
          });
        },
        'should `not occur` error': function (topic) {
          assert.ok(!topic);
        },
      },
      'with specify `number` func illegale option': {
        topic: function (parent) {
          return parent({ func: 'add' }, 1);
        },
        'should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `null` func illegale option': {
        topic: function (parent) {
          return parent({ func: 'add' }, null);
        },
        'should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `object` func illegale option': {
        topic: function (parent) {
          return parent({ func: 'add' }, {});
        },
        'should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
      'with specify `empty string` func illegale option': {
        topic: function (parent) {
          return parent({ func: 'add' }, '');
        },
        'should `occur` error': function (topic) {
          assert.ok(topic);
        },
      },
    },
  },
})).addBatch(whenSubmitJob({
  'when subbmit job,': {
    topic: function (parent) {
      return parent({
        func: 'add', args: { a: 1, b: 2 }
      });
    },
    'call `regist`': {
      topic: function () {
        return function (options) {
          return emitter(function (promise) {
            var worker = new Worker();
            worker.connect(function (err) {
              if (err) {
                promise.emit('error', err);
                return;
              }
              worker.regist(options, function (job) {
                promise.emit('success', job);
              });
            });
          });
        };
      },
      'with `add` func option': {
        topic: function (parent) {
          return parent({
            func: 'add'
          });
        },
        'should returned `Job` object by callback': function (topic) {
          assert.instanceOf(topic, Job);
        },
        'should exists `id` property in a job object': function (topic) {
          assert.ok(topic.id);
        },
        'An arguments `a` should be `1`': function (topic) {
          assert.equal(topic.args.a, 1);
        },
        'An arguments `b` should be `2`': function (topic) {
          assert.equal(topic.args.b, 2);
        },
      },
    },
  }
})).export(module);
