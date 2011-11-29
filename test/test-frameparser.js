/**
 * test-frameparser.js
 * @fileoverview FrameParser class tests
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var vows = require('vows');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var FrameParser = require('../lib/common').FrameParser;
var emitter = require('./helper').emitter;


// 
// test(s)
//

var suite = vows.describe('client.js tests');
suite.addBatch({
  'create a `FrameParser` object': {
    topic : function () {
      return function () {
        return new FrameParser(arguments[0]);
      };
    },
    'with default constructor': {
      topic: function (parent) {
        return parent();
      },
      'demiliter should be `\\n`': function (topic) {
        assert.equal(topic.demiliter, '\n');
      },
    },
    'with demiliter constructor': {
      topic: function (parent) {
        return parent('\n');
      },
      'demiliter should be `\\n`': function (topic) {
        assert.equal(topic.demiliter, '\n');
      },
    },
  }
}).addBatch({
  'create `FrameParser` object,': {
    topic: new FrameParser(),
    'call `expand`': {
      topic: function (parser) {
        return function (data) {
          return parser.expand(data);
        };
      },
      'with `hello\\nworld\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello\nworld\n'));
        },
        'should returned `Array` object': function (topic) {
          assert.isArray(topic);
        },
        'should be `2` length of returned array': function (topic) {
          assert.lengthOf(topic, 2);
        },
        'should include `"hello" and "world"` in returned array': function (topic) {
          assert.include(topic, 'hello');
          assert.include(topic, 'world');
        }
      },
      'with `null` illegal data': {
        topic: function (parent) {
          return parent(null);
        },
        'should returned `empty` array': function (topic) {
          assert.isEmpty(topic);
        }
      },
      'with `\\n` nothing Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello world'));
        },
        'should returned `empty` array': function (topic) {
          assert.isEmpty(topic);
        }
      },
      'with `\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('\n'));
        },
        'should returned `empty` array': function (topic) {
          assert.isEmpty(topic);
        }
      },
      'with `\\n\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('\n\n'));
        },
        'should returned `empty` array': function (topic) {
          assert.isEmpty(topic);
        }
      },
      'with `hello\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello\n'));
        },
        'should be `1` length of returned array': function (topic) {
          assert.lengthOf(topic, 1);
        },
        'should include `"hello"` in returned array': function (topic) {
          assert.include(topic, 'hello');
        }
      },
      'with `hello\\n\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello\n\n'));
        },
        'should be `1` length of returned array': function (topic) {
          assert.lengthOf(topic, 1);
        },
        'should include `"hello"` in returned array': function (topic) {
          assert.include(topic, 'hello');
        }
      },
      'with `\\nhello\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('\nhello\n'));
        },
        'should be `1` length of returned array': function (topic) {
          assert.lengthOf(topic, 1);
        },
        'should include `"hello"` in returned array': function (topic) {
          assert.include(topic, 'hello');
        }
      },
      'with `hello\\n\\nworld` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello\n\nworld'));
        },
        'should be `1` length of returned array': function (topic) {
          assert.lengthOf(topic, 1);
        },
        'should include `"hello"` in returned array': function (topic) {
          assert.include(topic, 'hello');
        }
      },
      'with `hello\\nworld` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello\nworld'));
        },
        'should be `1` length of returned array': function (topic) {
          assert.lengthOf(topic, 1);
        },
        'should include `"hello"` in returned array': function (topic) {
          assert.include(topic, 'hello');
        }
      }
      // TODO: should tested many illegal data !!
    },
    'call `expand` with callback': {
      topic: function (parser) {
        return function (data) {
          return emitter(function (promise) {
            var frames = [];
            parser.expand(data, function (frame) {
              frames.push(frame);
            });
            promise.emit('success', frames);
          });
        }
      },
      'and `hello\\nworld\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello\nworld\n'));
        },
        'should catched `2` callbacks': function (topic) {
          assert.lengthOf(topic, 2);
        },
        'should emited `hello`, `world`': function (topic) {
          assert.include(topic, 'hello');
          assert.include(topic, 'world');
        },
      },
      'and `null` illegal data': {
        topic: function (parent) {
          return parent(null);
        },
        'should `not` catched callback': function (topic) {
          assert.isEmpty(topic);
        }
      },
      'and `\\n` nothing Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello world'));
        },
        'should `not` catched callback': function (topic) {
          assert.isEmpty(topic);
        }
      },
      'and `\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('\n'));
        },
        'should `not` catched callback': function (topic) {
          assert.isEmpty(topic);
        }
      },
      'and `\\n\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('\n\n'));
        },
        'should `not` catched callback': function (topic) {
          assert.isEmpty(topic);
        }
      },
      'and `hello\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello\n'));
        },
        'should catched `1` callback': function (topic) {
          assert.lengthOf(topic, 1);
        },
        'should emited `hello`': function (topic) {
          assert.include(topic, 'hello');
        }
      },
      'and `hello\\n\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello\n\n'));
        },
        'should catched `1` callback': function (topic) {
          assert.lengthOf(topic, 1);
        },
        'should emited `hello`': function (topic) {
          assert.include(topic, 'hello');
        }
      },
      'and `\\nhello\\n` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('\nhello\n'));
        },
        'should catched `1` callback': function (topic) {
          assert.lengthOf(topic, 1);
        },
        'should emited `hello`': function (topic) {
          assert.include(topic, 'hello');
        }
      },
      'and `hello\\n\\nworld` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello\n\nworld'));
        },
        'should catched `1` callback': function (topic) {
          assert.lengthOf(topic, 1);
        },
        'should emited `hello`': function (topic) {
          assert.include(topic, 'hello');
        }
      },
      'and `hello\\nworld` Buffer data': {
        topic: function (parent) {
          return parent(new Buffer('hello\nworld'));
        },
        'should catched `1` callback': function (topic) {
          assert.lengthOf(topic, 1);
        },
        'should emited `hello`': function (topic) {
          assert.include(topic, 'hello');
        }
      }
    },
    'call `shrink`': {
      topic: function (parser) {
        return function (frame) {
          return parser.shrink(frame);
        };
      },
      'with `["hello", "world"]` data': {
        topic: function (parent) {
          return parent(['hello', 'world']);
        },
        'should returned `Buffer` object': function (topic) {
          assert.equal(topic.constructor.name, 'Buffer');
        },
        'should be `hello\\nworld\\n`': function (topic) {
          assert.equal(topic.toString(), (new Buffer('hello\nworld\n')).toString());
        }
      },
      'with `null` data': {
        topic: function (parent) {
          return parent(null);
        },
        'should returned `null`': function (topic) {
          assert.isNull(topic);
        }
      }
      // TODO: should tested many illegal data !!
    }
  }
}).export(module);
