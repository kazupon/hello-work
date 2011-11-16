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

function whenCallDoMethod (target) {
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
  top_context['When start agent and call `do` method'] = top_context_properties;
  return top_context;
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
      'should `occur` error': function (topic) {
        assert.ok(topic);
      },
    },
  },
}).addBatch(whenCallDoMethod({
  'with specify `all` options': {
    topic: function (parent) {
      return parent({
        ns: '/', func: 'hoge', args: { a: 1, b: 1 }, timeout: 1000
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `hoge` func property on a job object': function (topic) {
      assert.equal(topic.func, 'hoge');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `ns` abbrev options': {
    topic: function (parent) {
      return parent({
        func: 'add', args: { a: 1, b: 1 }, timeout: 1000,
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `func` abbrev options': {
    topic: function (parent) {
      return parent({
        ns: '/hoge/', args: { a: 1, b: 1 }, timeout: 1000,
      });
    },
    'should `occur` error': function (err, topic) {
      assert.instanceOf(err, Error);
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `args` abbrev options': {
    topic: function (parent) {
      return parent({
        ns: '/', func: 'add', timeout: 1000
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `timeout` abbrev options': {
    topic: function (parent) {
      return parent({
        ns: '/hoge/', func: 'add', args: { a: 1, b: 1 },
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/hoge/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/hoge/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `callback` only': {
    topic: function (parent) {
      return parent({ cb: false });
    },
    'should `occur` error': function (err, topic) {
      assert.instanceOf(err, Error);
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `none`': {
    topic: function (parent) {
      return parent();
    },
    'should `occur` error': function (err, topic) {
      assert.instanceOf(err, Error);
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `number` ns illegale option': {
    topic: function (parent) {
      return parent({
        ns: 0, func: 'add', args: { a: 1, b: 1 }
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `null` ns illegale option': {
    topic: function (parent) {
      return parent({
        ns: null, func: 'add', args: { a: 1, b: 1 }
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `object` ns illegale option': {
    topic: function (parent) {
      return parent({
        ns: {}, func: 'add', args: { a: 1, b: 1 }
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `empty string` ns illegale option': {
    topic: function (parent) {
      return parent({
        ns: '', func: 'add', args: { a: 1, b: 1 }
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `not path string` ns illegale option': {
    topic: function (parent) {
      return parent({
        ns: 'hello', func: 'add', args: { a: 1, b: 1 }
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `sub path string` ns option': {
    topic: function (parent) {
      return parent({
        ns: '/hoge/foo/', func: 'add', args: { a: 1, b: 1 }
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/hoge/foo/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/hoge/foo/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `number` func illegale option': {
    topic: function (parent) {
      return parent({
        func: 32, args: { a: 1, b: 1 }
      });
    },
    'should `occur` error': function (err, topic) {
      assert.instanceOf(err, Error);
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `null` func illegale option': {
    topic: function (parent) {
      return parent({
        func: null, args: { a: 1, b: 1 }
      });
    },
    'should `occur` error': function (err, topic) {
      assert.instanceOf(err, Error);
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `object` func illegale option': {
    topic: function (parent) {
      return parent({
        func: {}, args: { a: 1, b: 1 }
      });
    },
    'should `occur` error': function (err, topic) {
      assert.instanceOf(err, Error);
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `empty string` func illegale option': {
    topic: function (parent) {
      return parent({
        func: '', args: { a: 1, b: 1 }
      });
    },
    'should `occur` error': function (err, topic) {
      assert.instanceOf(err, Error);
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `number` args option': {
    topic: function (parent) {
      return parent({
        ns: 'hoge', func: 'add', args: 22
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `null` args option': {
    topic: function (parent) {
      return parent({
        func: 'add', args: null 
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `empty object` args option': {
    topic: function (parent) {
      return parent({
        func: 'add', args: {}
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `string` args option': {
    topic: function (parent) {
      return parent({
        func: 'add', args: 'hello'
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `function` args option': {
    topic: function (parent) {
      return parent({
        func: 'add', args: function () { console.log('hoge'); }
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `negative number` timeout illegale option': {
    topic: function (parent) {
      return parent({
        func: 'add', args: { a: 1, b: 2 }, timeout: -10
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `float number` timeout option': {
    topic: function (parent) {
      return parent({
        func: 'add', args: { a: 1, b: 2 }, timeout: 10.00
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `null` timeout illegale option': {
    topic: function (parent) {
      return parent({
        func: 'add', args: { a: 1, b: 2 }, timeout: null
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `object` timeout illegale option': {
    topic: function (parent) {
      return parent({
        func: 'add', args: { a: 1, b: 2 }, timeout: {}
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `string` timeout illegale option': {
    topic: function (parent) {
      return parent({
        func: 'add', args: { a: 1, b: 2 }, timeout: 'hoge'
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
  'with specify `function` timeout illegale option': {
    topic: function (parent) {
      return parent({
        func: 'add', args: { a: 1, b: 2 }, timeout: function () {}
      });
    },
    'should `not occur` error': function (err, topic) {
      assert.isNull(err);
    },
    'should returned `Job` object': function (topic) {
      assert.instanceOf(topic, Job);
    },
    'should be `/` ns property on a job object': function (topic) {
      assert.equal(topic.ns, '/');
    },
    'should be `add` func property on a job object': function (topic) {
      assert.equal(topic.func, 'add');
    },
  },
})).addBatch(whenCallDoMethod({
})).addBatch(whenCallDoMethod({
  /*
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
      //', callback `complete`': {
      //  topic: function (job) {
      //    return emitter(function (promise) {
      //      job.on('complete', function (res) {
      //        promise.emit('success', res);
      //      });
      //    });
      //  },
      //  'should returned `res` object': function (topic) {
      //    assert.ok(topic);
      //  },
      //  'should be `2` result': function (topic) {
      //    assert.equal(topic.result, 2);
      //  },
      //}
    },
  }
  */
})).export(module);

