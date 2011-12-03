/**
 * test-base.js
 * @fileoverview base.js tests
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var vows = require('vows');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var Agent = require('../lib/agent').Agent;
var Base = require('../lib/base').Base;
var whenServerRunning = require('./helper').whenServerRunning;
var emitter = require('./helper').emitter;


// 
// test(s)
// 

var whenCallConnect = function (target) {
  var top_context = {};
  var top_context_properties = {};
  var base;
  top_context_properties.topic = function () {
    return function () {
      var args = [];
      var self = arguments;
      return emitter(function (promise) {
        try {
          var onEmit = function (err) {
            console.log('whenCallConnect : ... base.connect');
            err ? promise.emit('error', err, base) : promise.emit('success', base);
          };
          var cb;
          if (typeof self[0] === 'object') {
            args.push(self[0]);
            self[1] && args.push(onEmit);
            if (self[1]) {
              cb = self[1];
            }
          } else {
            self[0] && args.push(onEmit);
            if (self[0]) {
              cb = self[0];
            }
          }
          base = new Base();
          if (!cb) {
            base.once('connect', onEmit);
          }
          base.connect.apply(base, args);
          console.log('whenCallConnect : base.connect ...');
        } catch (e) {
          console.error('whenCallConnect : %s', e.message);
          process.nextTick(function () {
            promise.emit('error', e);
          });
        }
      });
    };
  };
  Object.keys(target).forEach(function (context) {
    top_context_properties[context] = target[context];
  });
  top_context_properties.teardown = function (topic) {
    console.log('whenCallConnect : teardown');
    var cb = this.callback;
    try {
        base.disconnect(function (err) {
          console.log('whenCallConnect : ... base.disconnect');
          cb();
        });
        console.log('whenCallConnect : base.disconnect ...');
    } catch (e) {
      console.error(e.message);
      cb();
    }
  };
  top_context['call `connect`'] = top_context_properties;
  return top_context;
}


var suite = vows.describe('base.js tests');
suite.addBatch({
  'A `Base` instacne': {
    topic: new Base(),
    'should be `null` host property': function (topic) {
      assert.isNull(topic.host);
    },
    'should be `null` port property': function (topic) {
      assert.isNull(topic.port);
    },
  },
}).addBatch(whenServerRunning(20000, 
  whenCallConnect({
    'with specify `host`, `port` and `callback`,': {
      topic: function (parent) {
        return parent({
          host: 'localhost',
          port: 20000
        }, function (err) { });
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Base instance should be `localhost` host property': function (topic) {
        assert.equal(topic.host, 'localhost');
     },
      'a Base instance should be `20000` port property': function (topic) {
        assert.equal(topic.port, 20000);
      },
    },
  })
)).addBatch(whenServerRunning(20000,
  whenCallConnect({
    'with specify `host` and `callback`,': {
      topic: function (parent) {
        return parent({
          host: 'localhost',
        }, function (err) { });
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Base instance should be `localhost` host property': function (topic) {
        assert.equal(topic.host, 'localhost');
      },
      'a Base instance should be `20000` port property': function (topic) {
        assert.equal(topic.port, 20000);
      },
    },
  })
)).addBatch(whenServerRunning(20000, 
  whenCallConnect({
    'with specify `port` and `callback`,': {
      topic: function (parent) {
        return parent({
          port: 20000,
        }, function (err) { });
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Base instance should be `localhost` host property': function (topic) {
        assert.equal(topic.host, 'localhost');
      },
      'a Base instance should be `20000` port property': function (topic) {
        assert.equal(topic.port, 20000);
      },
    },
  })
)).addBatch(whenServerRunning(20000,
  whenCallConnect({
    'with specify `port` and `host`': {
      topic: function (parent) {
        return parent({
          host: 'localhost',
          port: 20000,
        });
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Base instance should be `localhost` host property': function (topic) {
        assert.equal(topic.host, 'localhost');
      },
      'a Base instance should be `20000` port property': function (topic) {
        assert.equal(topic.port, 20000);
      },
    },
  })
)).addBatch(whenServerRunning(20000,
  whenCallConnect({
    'with specify `none`': {
      topic: function (parent) {
        return parent();
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Base instance should be `localhost` host property': function (topic) {
        assert.equal(topic.host, 'localhost');
      },
      'a Base instance should be `20000` port property': function (topic) {
        assert.equal(topic.port, 20000);
      },
    },
  })
)).addBatch(whenServerRunning(20000,
  whenCallConnect({
    'with specify `callback` only': {
      topic: function (parent) {
        return parent(function (err) {});
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Base instance should be `localhost` host property': function (topic) {
        assert.equal(topic.host, 'localhost');
      },
      'a Base instance should be `20000` port property': function (topic) {
        assert.equal(topic.port, 20000);
      },
    },
  })
)).addBatch(whenServerRunning(20000,
  whenCallConnect({
    'with specify `0` port': {
      topic: function (parent) {
        return parent({
          port: 0,
        });
      },
      'the connect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Base instance should be `null` host property': function (err, topic) {
        assert.isNull(topic.host);
      },
      'a Base instance should be `null` port property': function (err, topic) {
        assert.isNull(topic.port);
      },
    },
  })
)).addBatch(whenServerRunning(20000,
  whenCallConnect({
    'with specify `-1` port': {
      topic: function (parent) {
        return parent({
          port: -1,
        });
      },
      'the connect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Base instance should be `null` host property': function (err, topic) {
        assert.isNull(topic.host);
      },
      'a Base instance should be `null` port property': function (err, topic) {
        assert.isNull(topic.port);
      },
    },
  })
)).addBatch(whenServerRunning(20000,
  whenCallConnect({
    'with specify `1024` port': {
      topic: function (parent) {
        return parent({
          port: 1024,
        });
      },
      'the connect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Base instance should be `null` host property': function (err, topic) {
        assert.isNull(topic.host);
      },
      'a Base instance should be `null` port property': function (err, topic) {
        assert.isNull(topic.port);
      },
    },
  })
)).addBatch(whenServerRunning(1025,
  whenCallConnect({
    'with specify `1025` port': {
      topic: function (parent) {
        return parent({
          port: 1025,
        });
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Base instance should be `localhost` host property': function (topic) {
        assert.equal(topic.host, 'localhost');
      },
      'a Base instance should be `1025` port property': function (topic) {
        assert.equal(topic.port, 1025);
      },
    },
  })
)).addBatch(whenServerRunning(32767,
  whenCallConnect({
    'with specify `32767` port': {
      topic: function (parent) {
        return parent({
          port: 32767,
        });
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Base instance should be `localhost` host property': function (topic) {
        assert.equal(topic.host, 'localhost');
      },
      'a Base instance should be `32767` port property': function (topic) {
        assert.equal(topic.port, 32767);
      },
    },
  })
)).addBatch(whenServerRunning(65535,
  whenCallConnect({
    'with specify `65535` port': {
      topic: function (parent) {
        return parent({
          port: 65535,
        });
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Base instance should be `localhost` host property': function (topic) {
        assert.equal(topic.host, 'localhost');
      },
      'a Base instance should be `65535` port property': function (topic) {
        assert.equal(topic.port, 65535);
      },
    },
  })
)).addBatch(whenServerRunning(65536, 
  whenCallConnect({
    'with specify `65536` port': {
      topic: function (parent) {
        return parent({
          port: 65536,
        });
      },
      'the connect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Base instance should be `null` host property': function (err, topic) {
        assert.isNull(topic.host);
      },
      'a Base instance should be `null` port property': function (err, topic) {
        assert.isNull(topic.port);
      },
    },
  })
)).addBatch(whenServerRunning(20000,
  whenCallConnect({
    'with specify `localhost` host': {
      topic: function (parent) {
        return parent({
          host: 'localhost',
        });
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Base instance should be `localhost` host property': function (topic) {
        assert.equal(topic.host, 'localhost');
      },
      'a Base instance should be `20000` port property': function (topic) {
        assert.equal(topic.port, 20000);
      },
    },
  })
)).addBatch(whenServerRunning(20000,
  whenCallConnect({
    'with specify `hoge`(none) host': {
      topic: function (parent) {
        return parent({
          host: 'hoge',
        });
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Base instance should be `null` host property': function (err, topic) {
        assert.isNull(topic.host);
      },
      'a Base instance should be `null` port property': function (err, topic) {
        assert.isNull(topic.port);
      },
    },
  })
)).addBatch(whenServerRunning(20000,
  whenCallConnect({
    'with specify `IP` host': {
      topic: function (parent) {
        return parent({
          host: '127.0.0.1',
        });
      },
      'the connect event type should be `success`': function (err, topic) {
        assert.isNull(err);
      },
      'a Base instance should be `127.0.0.1` host property': function (topic) {
        assert.equal(topic.host, '127.0.0.1');
      },
      'a Base instance should be `20000` port property': function (topic) {
        assert.equal(topic.port, 20000);
      },
    },
  })
)).addBatch(whenServerRunning(20000,
  whenCallConnect({
    'with illegal specify `0` host': {
      topic: function (parent) {
        return parent({
          host: '0',
        });
      },
      'the connect event type should be `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'a Base instance should be `null` host property': function (err, topic) {
        assert.isNull(topic.host);
      },
      'a Base instance should be `null` port property': function (err, topic) {
        assert.isNull(topic.port);
      },
    },
  })
)).addBatch(whenServerRunning(25000, {
  'call `connect` with callback': {
    topic: function () {
      var base = new Base();
      return emitter(function (promise) {
        base.connect({ port: 25000 }, function (err) {
          err ? promise.emit('error', err, base)
              : promise.emit('success', base);
        });
      });
    },
    'should occur `success` callback': function (err, topic) {
      assert.isNull(err);
      assert.instanceOf(topic, Base);
    },
    'should be `localhost` host property': function (topic) {
      assert.equal(topic.host, 'localhost');
    },
    'should be `25000` port property': function (topic) {
      assert.equal(topic.port, 25000);
    },
    ', call `disconnect` with callback': {
      topic: function (parent) {
        var base = parent;
        return emitter(function (promise) {
          base.disconnect(function (err) {
            err ? promise.emit('error', err, base)
                : promise.emit('success', base);
          });
        });
      },
      'should occur `success` callback': function (err, topic) {
        assert.isNull(err);
        assert.instanceOf(topic, Base);
      },
      'should be `null` host property': function (topic) {
        assert.isNull(topic.host);
      },
      'should be `null` port property': function (topic) {
        assert.isNull(topic.port);
      },
    },
  },
})).addBatch(whenServerRunning(25001, {
  'call `connect` with `on` event handling': {
    topic: function () {
      var base = new Base();
      return emitter(function (promise) {
        base.once('connect', function (err) {
          err ? promise.emit('error', err, base)
              : promise.emit('success', base);
        });
        base.connect({ port: 25001 });
      });
    },
    'should occur `connect` event': function (err, topic) {
      assert.isNull(err);
      assert.instanceOf(topic, Base);
    },
    'should be `localhost` host property': function (topic) {
      assert.equal(topic.host, 'localhost');
    },
    'should be `25001` port property': function (topic) {
      assert.equal(topic.port, 25001);
    },
    ', call `disconnect` with `on` event handling': {
      topic: function (parent) {
        var base = parent;
        return emitter(function (promise) {
          base.once('disconnect', function (err) {
            err ? promise.emit('error', err, base)
                : promise.emit('success', base);
          });
          base.disconnect();
        });
      },
      'should occur `disconnect` event': function (err, topic) {
        assert.isNull(err);
        assert.instanceOf(topic, Base);
      },
      'should be `null` host property': function (topic) {
        assert.isNull(topic.host);
      },
      'should be `null` port property': function (topic) {
        assert.isNull(topic.port);
      },
      ', call `disconnect` with callback': {
        topic: function (parent) {
          var base = parent;
          return emitter(function (promise) {
            base.disconnect(function (err) {
              err ? promise.emit('error', err, base)
                  : promise.emit('success', base);
            });
          });
        },
        'should occur `error` callabck': function (err, topic) {
          assert.instanceOf(err, Error);
        },
        'should be `null` host property': function (err, topic) {
          assert.isNull(topic.host);
        },
        'should be `null` port property': function (err, topic) {
          assert.isNull(topic.port);
        },
      },
    },
  },
})).addBatch(whenServerRunning(25003, {
  'call `connect` with callback': {
    topic: function () {
      var base = new Base();
      return emitter(function (promise) {
        base.connect({ port: 25003 }, function (err) {
          err ? promise.emit('error', err, base)
              : promise.emit('success', base);
        });
      });
    },
    ', call `connect` with callback': {
      topic: function (parent) {
        var base = parent;
        return emitter(function (promise) {
          base.connect({ port: 25003 }, function (err) {
            err ? promise.emit('error', err, base)
                : promise.emit('success', base);
          });
        });
      },
      'should occur `error` callback': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'should be `localhost` host property': function (err, topic) {
        assert.equal(topic.host, 'localhost');
      },
      'should be `25003` port property': function (err, topic) {
        assert.equal(topic.port, 25003);
      },
    },
  },
})).addBatch(whenServerRunning(25004, {
  'call `disconnect` with callback': {
    topic: function () {
      var base = new Base();
      return emitter(function (promise) {
        base.disconnect(function (err) {
          err ? promise.emit('error', err, base)
              : promise.emit('success', base);
        });
      });
    },
    'should occur `error` callabck': function (err, topic) {
      assert.instanceOf(err, Error);
    },
    'should be `null` host property': function (err, topic) {
      assert.isNull(topic.host);
    },
    'should be `null` port property': function (err, topic) {
      assert.isNull(topic.port);
    },
  }
})).addBatch({
  'when hellowork server not running': {
    topic: new Base(),
    ', call `connect`': {
      topic: function (base) {
        return emitter(function (promise) {
          base.connect({ port: 20000 }, function (err) {
            err ? promise.emit('error', err, base)
                : promise.emit('success', base);
          });
        });
      },
      'should occur `error` callabck': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'should be `null` host property': function (err, topic) {
        assert.isNull(topic.host);
      },
      'should be `null` port property': function (err, topic) {
        assert.isNull(topic.port);
      }
    },
    ', call `disconnect`': {
      topic: function (base) {
        return emitter(function (promise) {
          base.disconnect(function (err) {
            err ? promise.emit('error', err, base)
                : promise.emit('success', base);
          });
        });
      },
      'should occur `error` callabck': function (err, topic) {
        assert.instanceOf(err, Error);
      },
      'should be `null` host property': function (err, topic) {
        assert.isNull(topic.host);
      },
      'should be `null` port property': function (err, topic) {
        assert.isNull(topic.port);
      }
    }
  }
}).addBatch(whenServerRunning(20000, {
  'call `connect` 2 times in a row,': {
    topic: function () {
      return function (interval) {
        return emitter(function (promise) {
          try {
            var base = new Base();
            base.connect(function (err) {
              console.log('fire connect');
            });
            setTimeout(function () {
              base.connect(function (err) {
                var connect_err = err;
                base.disconnect(function (err) {
                  connect_err ? promise.emit('error', connect_err, base)
                              : promise.emit('success', base);
                });
              });
            }, interval);
          } catch (e) {
            promise.emit('error', err);
          }
        });
      }
    },
    'status `connecting`': {
      topic: function (parent) {
        return parent(0);
      },
      'should occred `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
    },
    'status `connected`': {
      topic: function (parent) {
        return parent(10);
      },
      'should occred `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
    }
  }
})).addBatch(whenServerRunning(20000, {
  'call `disconnect` 2 times in a row,': {
    topic: function () {
      return function (interval) {
        return emitter(function (promise) {
          try {
            var base = new Base();
            base.connect(function (err) {
              console.log('fire connect');
              setTimeout(function () {
                base.disconnect(function (err) {
                  console.log('fire 1 disconnect');
                });
                setTimeout(function () {
                  base.disconnect(function (err) {
                    console.log('fire 2 disconnect');
                    err ? promise.emit('error', err, base)
                        : promise.emit('success', base);
                  });
                }, interval);
              }, 10);
            });
          } catch (e) {
            promise.emit('error', err);
          }
        });
      }
    },
    'status `closing`': {
      topic: function (parent) {
        return parent(0);
      },
      'should occred `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
    },
    'status `closed`': {
      topic: function (parent) {
        return parent(10);
      },
      'should occred `error`': function (err, topic) {
        assert.instanceOf(err, Error);
      },
    },
    //teardown: function (topic) {
    //  var cb = this.callback;
    //  setTimeout(function () {
    //    cb();
    //    console.log('teardown done');
    //  }, 100);
    //}
  }
})).addBatch({
  'when agent `start`,': {
    topic: function () {
      var agent = new Agent();
      this.agent = agent;
      agent.start(20000, this.callback);
    },
    'call `connect`,': {
      topic: function () {
        var base = new Base();
        this.base = base;
        base.connect(this.callback);
      },
      'stop `agent`,': {
        topic: function () {
          var agent = this.agent;
          agent.stop();
          console.log('call stop !!');
          this.callback();
        },
        'call `disconnect`,': {
          topic: function () {
            var base = this.base;
            return function (timing) {
              return emitter(function (promise) {
                setTimeout(function () {
                  base.disconnect(function (err) {
                    err ? promise.emit('error', err) : promise.emit('success');
                  });
                }, timing);
              });
            };
          },
          'at the same time': {
            topic: function (parent) {
              return parent(0);
            },
            'should occured `error`': function (err, topic) {
              assert.instanceOf(err, Error);
            }
          },
          'after passed 5 ms': {
            topic: function (parent) {
              return parent(5);
            },
            'should occured `error`': function (err, topic) {
              assert.instanceOf(err, Error);
            }
          },
          'after passed 10 ms': {
            topic: function (parent) {
              return parent(10);
            },
            'should occured `error`': function (err, topic) {
              assert.instanceOf(err, Error);
            }
          },
          'after passed 100 ms': {
            topic: function (parent) {
              return parent(100);
            },
            'should occured `error`': function (err, topic) {
              assert.instanceOf(err, Error);
            }
          },
        }
      }
    }
  }
}).export(module);
