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
var Client = require('../lib/client').Client;
var Worker = require('../lib/worker').Worker;
var emitter = require('./helper').emitter;


//
// test(s)
//

var suite = vows.describe('agent.js tests');
suite.addBatch({
  'when create an Agent object': {
    'with `new`': {
      topic: function () {
        return emitter(function (promise) {
          promise.emit('success', new Agent());
        });
      },
      'should return Agent object': function (agent) {
        assert.instanceOf(agent, Agent);
      }
    },
    'with `function`': {
      topic: function () {
        return emitter(function (promise) {
          promise.emit('success', Agent());
        });
      },
      'should return Agent object': function (agent) {
        assert.instanceOf(agent, Agent);
      }
    }
  }
}).addBatch({
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
      }
    }
  }
}).addBatch({
  'when call `start` specific port `20000`,': {
    topic: function () {
      return emitter(function (promise) {
        var agent = new Agent();
        agent.start(20000, function () {
          promise.emit('success', agent);
        });
      });
    },
    teardown: function (agent) {
      agent.stop(this.callback.bind(this));
    },
    'call `start` with specific port `20000`,': {
      topic: function (agent) {
        agent.on('error', this.callback);
        agent.start(20000);
      },
      'should occur `error` event': function (err, topic) {
        assert.instanceOf(err, Error);
        assert.isUndefined(topic);
      },
    }
  }
}).addBatch({
  'when agent `start`': {
    topic: function () {
      return emitter(function (promise) {
        var agent = new Agent();
        agent.start(33333);
        agent.on('start', promise.emit.bind(promise, 'start'));
        promise.emit('success', agent);
      });
    },
    on: {
      'start': {
        'will catch event': function (topic) {
          assert.isUndefined(topic);
        },
        'agent `stop`': {
          topic: function (agent) {
            return emitter(function (promise) {
              agent.on('stop', promise.emit.bind(promise, 'stop'));
              agent.stop();
              promise.emit('success', agent);
            });
          },
          on: {
            'stop': {
              'will catch event': function (topic) {
                assert.isUndefined(topic);
              }
            }
          }
        }
      }
    }
  }
}).addBatch({
  'When many clients conncted': {
    topic: function () {
      return emitter(function (promise) {
        var agent = new Agent();
        var n = 100;
        var counter = 0;
        agent.start(20000, function () {
          for (var i = 0; i < n; i++) {
            var base = new Base();
            base.connect(function (err) {
              counter++;
              if (counter === n) {
                promise.emit('success', agent);
              }
            });
          }
        });
      });
    },
    'call `stop`': {
      topic: function (agent) {
        return emitter(function (promise) {
          agent.on('stop', promise.emit.bind(promise, 'stop'));
          agent.stop();
          promise.emit('success', agent);
        });
      },
      on: {
        'stop': {
          'will catch event': function (topic) {
            assert.isUndefined(topic);
          }
        }
      }
    }
  }
}).addBatch({
  'When agent `start`': {
    topic: function () {
      return emitter(function (promise) {
        var agent = new Agent();
        agent.start(30000, promise.emit.bind(promise, 'start'));
        promise.emit('success', agent);
      });
    },
    teardown: function (agent) {
      agent.stop(this.callback.bind(this));
    },
    on: {
      'start': {
        'worker `regist`, client `do`': {
          topic: function () {
            return emitter(function (promise) {
              var worker = new Worker();
              var client = new Client();
              worker.connect({ port: 30000 }, function (err) {
                client.connect({ port: 30000 }, function (err) {
                  worker.regist({ func: 'add' }, function (job, done) {
                    var ret = job.args.a + job.args.b;
                    promise.emit('assigned', ret);
                    done(ret);
                  });
                  setTimeout(function () {
                    client.do({ func: 'add', args: { a: 1, b: 1 } }, function (job) {
                      job.on('complete', promise.emit.bind(promise, 'complete'));
                    });
                  }, 100);
                  promise.emit('success', worker, client);
                });
              });
            });
          },
          teardown: function (worker, client) {
            var cb = this.callback;
            worker.disconnect(function (err) {
              client.disconnect(function (err) {
                cb();
              });
            });
          },
          on: {
            'assigned': {
              'will catch event': function (ret) {
                assert.equal(ret, 2);
              }
            },
            'complete': {
              'will catch `2` value result': function (res) {
                assert.equal(res.result, 2);
              }
            }
          }
        }
      }
    }
  }
}).addBatch({
  'When agent `start`': {
    topic: function () {
      return emitter(function (promise) {
        var agent = new Agent();
        agent.start(30000, promise.emit.bind(promise, 'start'));
        promise.emit('success', agent);
      });
    },
    teardown: function (agent) {
      agent.stop(this.callback.bind(this));
    },
    on: {
      'start': {
        'client `do`, worker `regist`': {
          topic: function () {
            return emitter(function (promise) {
              var worker = new Worker();
              var client = new Client();
              worker.connect({ port: 30000 }, function (err) {
                client.connect({ port: 30000 }, function (err) {
                  client.do({ func: 'add', args: { a: 1, b: 1 } }, function (job) {
                    job.on('complete', promise.emit.bind(promise, 'complete'));
                  });
                  setTimeout(function () {
                    worker.regist({ func: 'add' }, function (job, done) {
                      var ret = job.args.a + job.args.b;
                      promise.emit('assigned', ret);
                      done(ret);
                    });
                  }, 100);
                  promise.emit('success', worker, client);
                });
              });
            });
          },
          teardown: function (worker, client) {
            var cb = this.callback;
            worker.disconnect(function (err) {
              client.disconnect(function (err) {
                cb();
              });
            });
          },
          on: {
            'assigned': {
              'will catch event': function (ret) {
                assert.equal(ret, 2);
              }
            },
            'complete': {
              'will catch `2` value result': function (res) {
                assert.equal(res.result, 2);
              }
            }
          }
        }
      }
    }
  }
}).export(module);

