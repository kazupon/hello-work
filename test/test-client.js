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
var format = require('util').format;
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
    var cb = this.callback;
    try {
      var release = function (cb) {
        client.disconnect(function (err) {
          console.log('... disconnect client');
          agent.stop(function () {
            console.log('... stop agent');
            cb();
          });
        });
      };
      release(cb);
    } catch (e) {
      console.error(e.message);
      cb();
    }
  };
  top_context['When start agent and call `do` method'] = top_context_properties;
  return top_context;
}

function whenOccuredEventOnJob (do_opts, regist_opts, regist_cb, event_name, target) {
  var top_context = {};
  var top_context_properties = {};
  var agent;
  var client;
  var worker;
  var event = event_name;
  var timer = arguments[5] || 10;
  top_context_properties.topic = function () {
    return emitter(function (promise) {
      try {
        agent = new Agent();
        agent.start(20000, function () {
          console.log('agent start ...');
          client = new Client();
          worker = new Worker();
          console.log('client connect ...');
          client.connect(function (err) {
            try {
              if (err) {
                promise.emit('error', err);
                return;
              }
              console.log('worker connect ...');
              worker.connect(function (err) {
                try {
                  if (err) {
                    promise.emit('error', err);
                    return;
                  }
                  console.log('worker regist ...');
                  worker.regist(regist_opts, regist_cb);
                  console.log('client submit ...');
                  setTimeout(function () {
                    client.do(do_opts, function (job) {
                      console.log('... client submit done');
                      try {
                        if (err) {
                          promise.emit('error', err);
                          return;
                        }
                        job.on(event, function () {
                          var args = Array.prototype.slice.call(arguments);
                          promise.emit.apply(promise, ['success'].concat(args));
                        });
                        job.on('timeout', function (code) {
                          promise.emit('success', code);
                        });
                      } catch (e) {
                        promise.emit('error', e);
                      }
                    });
                  }, timer);
                } catch (e) {
                  promise.emit('error', e);
                }
              });
            } catch (e) {
              process.nextTick(promise.emit.bind(promise, 'error', e));
            }
          });
        });
      } catch (e) {
        process.nextTick(promise.emit.bind(promise, 'error', e));
      }
    });
  };
  Object.keys(target).forEach(function (context) {
    top_context_properties[context] = target[context];
  });
  top_context_properties.teardown = function (topic) {
    var cb = this.callback;
    try {
      worker.disconnect(function (err) {
        console.log('... disconnect worker');
        client.disconnect(function (err) {
          console.log('... disconnect client');
          agent.stop(function (err) {
            console.log('... stop agent');
            cb();
          });
        });
      });
    } catch (e) {
      console.error(e.message);
    }
  };
  var desc = format('When start agent, and a job was returned by calling `do` method with `%j` option(s), and occured `%s` event', do_opts, event);
  top_context[desc] = top_context_properties;
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
})).addBatch(
  whenOccuredEventOnJob({
    func: 'add', args: { a: 1, b: 1 } }, {
    func: 'add' }, function (job, done) {
      done(job.args.a + job.args.b);
    }, 'complete', {
    'should returned `2` value response': function (topic) {
      assert.equal(topic.result, 2);
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    ns: '/hoge/', func: 'add', args: { a: 1, b: 1 } }, {
    ns: '/hoge/', func: 'add' }, function (job, done) {
      done(job.args.a + job.args.b);
    }, 'complete', {
    'should returned `2` value response': function (topic) {
      assert.equal(topic.result, 2);
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'getReturnNull', args: { a: 1, b: 1 } }, {
    func: 'getReturnNull' }, function (job, done) {
      done(null);
    }, 'complete', {
    'should returned `null` value response': function (topic) {
      assert.isNull(topic.result);
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'getReturnObject', args: { a: 1, b: 1 } }, {
    func: 'getReturnObject' }, function (job, done) {
      done({ hoge: 'hoge' });
    }, 'complete', {
    'should returned `object` value response': function (topic) {
      assert.isObject(topic.result);
      assert.include(topic.result, 'hoge');
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'getReturnUndefined', args: { a: 1, b: 1 } }, {
    func: 'getReturnUndefined' }, function (job, done) {
      done(undefined);
    }, 'complete', {
    'should returned `undefined` value response': function (topic) {
      assert.isUndefined(topic.result);
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'getReturnString', args: { a: 1, b: 1 } }, {
    func: 'getReturnString' }, function (job, done) {
      done('hello');
    }, 'complete', {
    'should returned `hello` value response': function (topic) {
      assert.equal(topic.result, 'hello');
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'getReturnArray', args: { a: 1, b: 1 } }, {
    func: 'getReturnArray' }, function (job, done) {
      done([1, 2, 3]);
    }, 'complete', {
    'should returned `[1, 2, 3]` value response': function (topic) {
      assert.deepEqual(topic.result, [1, 2, 3]);
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'getReturnFunction', args: { a: 1, b: 1 } }, {
    func: 'getReturnFunction' }, function (job, done) {
      done(function () { console.log('hoge'); });
    }, 'complete', {
    'should returned `undefined` value response': function (topic) {
      assert.isUndefined(topic.result);
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'argsPatternString', args: { a: 'hello', b: 'world' } }, {
    func: 'argsPatternString' }, function (job, done) {
      done(job.args.a + job.args.b);
    }, 'complete', {
    'should returned `helloworld` value response': function (topic) {
      assert.equal(topic.result, 'helloworld');
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'argsPatternArray', args: { a: [1, 2, 3], b: [4, 5, 6] } }, {
    func: 'argsPatternArray' }, function (job, done) {
      done(job.args.a.concat(job.args.b));
    }, 'complete', {
    'should returned `[1, 2, 3, 4, 5, 6]` value response': function (topic) {
      assert.deepEqual(topic.result, [1, 2, 3, 4, 5, 6]);
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'argsPatternObject', args: { a: { foo: 1 }, b: { bar: 2 } } }, {
    func: 'argsPatternObject' }, function (job, done) {
      done(job.args.a.foo + job.args.b.bar);
    }, 'complete', {
    'should returned `3` value response': function (topic) {
      assert.equal(topic.result, 3);
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'processingEvent', args: { a: 1, b: 2 } }, {
    func: 'processingEvent' }, function (job, done) {
      setTimeout(function () {
        done(job.args.a + job.args.b);
      }, 2000);
    }, 'processing', {
    'should occur `processing` event': function (topic) {
      assert.isUndefined(topic);
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'returnError', args: { a: 1, b: 1 } }, {
    func: 'returnError' }, function (job, done) {
      done(new Error('Hoge Error'));;
    }, 'fail', {
    'should returned `Error` value response': function (topic) {
      assert.instanceOf(topic.err, Error);
      assert.equal(topic.err.message, 'Hoge Error');
    },
  })
).addBatch(
  whenOccuredEventOnJob({
    func: 'raiseError', args: { a: 1, b: 1 } }, {
    func: 'raiseError' }, function (job, done) {
      throw new Error('Foo Error');
    }, 'fail', {
    'should returned `Error` value response': function (topic) {
      assert.instanceOf(topic.err, Error);
      assert.equal(topic.err.message, 'Foo Error');
    },
  })
  /*
).addBatch(
  whenOccuredEventOnJob({
    func: 'raiseTimeout', args: { a: 40 }, timeout: 1 }, {
    func: 'raiseTimeout' }, function (job, done) {
      setTimeout(function () {
        done(job.args.a);
      }, 5000);
    }, 'timeout', {
    'should returned `2` value response': function (topic) {
      assert.equal(topic.code, 2);
    },
  })
  */
).addBatch({
  'when `start` agent,': {
    topic: function () {
      var agent = new Agent();
      this.agent = agent;
      agent.start(20000, this.callback);
    },
    'call client `connect`,': {
      topic: function () {
        var client = new Client();
        this.client = client;
        client.connect(this.callback);
      },
      'call client': {
        topic: function () {
          var client = this.client;
          return function (options) {
            return emitter(function (promise) {
              var ret_job;
              client.do(options.params, function (job) {
                console.log('create job1 : %j', job);
                ret_job = job;
              });
              setTimeout(function () {
                client.do({
                  func: options.params.func + '1'
                }, function (job) {
                  console.log('create job2 : %j', job);
                  promise.emit('success', ret_job);
                });
              }, options.timing);
            });
          };
        },
        'at the same time': {
          topic: function (parent) {
            return parent({
              params: {
                func: 'add',
                args: {
                  a: 1,
                  b: 1
                }
              },
              timing: 0
            });
          },
          'func property of job should be `add`': function (job) {
            assert.equal(job.func, 'add');
          },
        },
        'after passed 10ms': {
          topic: function (parent) {
            return parent({
              params: {
                func: 'mul',
                args: {
                  a: 1,
                  b: 1
                }
              },
              timing: 10
            });
          },
          'func property of job should be `mul`': function (job) {
            assert.equal(job.func, 'mul');
          },
        },
        'after passed 100ms': {
          topic: function (parent) {
            return parent({
              params: {
                func: 'sub',
                args: {
                  a: 1,
                  b: 1
                }
              },
              timing: 100
            });
          },
          'func property of job should be `sub`': function (job) {
            assert.equal(job.func, 'sub');
          }
        },
        'after passed 1000ms': {
          topic: function (parent) {
            return parent({
              params: {
                func: 'div',
                args: {
                  a: 1,
                  b: 1
                }
              },
              timing: 1000
            });
          },
          'func property of job should be `div`': function (job) {
            assert.equal(job.func, 'div');
          }
        }
      }
    },
    teardown: function (topic) {
      var cb = this.callback;
      var agent = this.agent;
      agent.stop(function () {
        console.log('agent stop');
        cb();
      });
    }
  }
}).addBatch({
  'agent `start`,': {
    topic: function () {
      var agent = new Agent();
      return emitter(function (promise) {
        agent.start(20000, function () {
          promise.emit('success', agent);
        });
      });
    },
    teardown: function (agent) {
      agent.stop(this.callback.bind(this));
    },
    'worker `connect`,': {
      topic: function (agent) {
        var worker = new Worker();
        return emitter(function (promise) {
          worker.connect(function (err) {
            promise.emit('success', worker); 
          });
        });
      },
      teardown: function (worker) {
        worker.disconnect(this.callback.bind(this));
      },
      'client `connect`,': {
        topic: function (worker, agent) {
          var client = new Client();
          return emitter(function (promise) {
            client.connect(function (err) {
              promise.emit('success', client);
            });
          });
        },
        teardown: function (client) {
          client.disconnect(this.callback.bind(this));
        },
        'worker `regist`': {
          topic: function (client, worker, agent) {
            var result = [];
            return emitter(function (promise) {
              worker.regist({ func: 'add' }, function (job, done) {
                var ret = job.args.a + job.args.b;
                result.push(ret);
                done(ret);
              });
              promise.emit('success', result);
            });
          },
          'create job': {
            topic: function (result1, client, worker, agent) {
              return function (n) {
                return emitter(function (promise) {
                  var result = [];
                  var counter = 0;
                  for (var i = 0; i < n; i++) {
                    client.do({
                      func: 'add',
                      args: {
                        a: Math.floor(Math.random() * 10),
                        b: Math.floor(Math.random() * 10)
                      }
                    }, function (job) {
                      job.on('complete', function (res) {
                        counter++;
                        result.push(res.result);
                        if (counter === n) {
                          promise.emit('success', result);
                        }
                      });
                    });
                  }
                });
              };
            },
            '5 times': {
              topic: function (parent) {
                return parent(5);
              },
              'should be `5` result': function (err, result) {
                assert.lengthOf(result, 5);
              }
            },
            //'50 times': {
            //  topic: function (parent) {
            //    return parent(50);
            //  },
            //  'should be `50` result': function (err, result) {
            //    assert.lengthOf(result, 50);
            //  }
            //},
            //'100 times': {
            //  topic: function (parent) {
            //    return parent(100);
            //  },
            //  'should be `100` result': function (err, result) {
            //    assert.lengthOf(result, 100);
            //  }
            //}
          }
        }
      }
    }
  }
}).export(module);

