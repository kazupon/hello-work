/**
 * test-util.js
 * @fileoverview util.js tests
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
// 

var vows = require('vows');
var assert = require('assert');
var format = require('util').format;
var util = require('../lib/util');
var EventEmitter = require('../lib/util').EventEmitter;


//
// test(s)
//

function withContext (func, args, ret) {
  var condition = (args && args.condition) || false;
  if (args && args.message && args.message.length > 0) {
    message = args.message;
  } else {
    message = '';
  }
  var context = {
    topic: func(condition, message),
  };
  var desc = format(
    '`%s` should be returned with `%s` condition and `%s` message', 
    ret, condition, message
  );
  context[desc] = function (res) {
    assert.equal(ret, res);
  };
  return context;
}


vows.describe('assert tests').addBatch({
  'true': withContext(util.assert, {
    condition: true, message: '',
  }, true),
  'false': withContext(util.assert, {
    condition: false, message: 'error',
  }, false),
  '1': withContext(util.assert, {
    condition: 1, message: '',
  }, true),
  '0': withContext(util.assert, {
    condition: 0, message: '',
  }, false),
  '-1': withContext(util.assert, {
    condition: -1, message: '',
  }, true),
  'null': withContext(util.assert, {
    condition: null, mesasge: 'hoge',
  }, false),
  'undefined': withContext(util.assert, {
    condition: undefined, message: 'hogehoge',
  }, false),
}).export(module);


vows.describe('EventEmitter tests').addBatch({
  'create extended `EventEmitter`': {
    topic: function () { 
      var wrap = {};
      wrap.emitter = new EventEmitter();
      return wrap;
    },
    'should create `EventEmitter` object': function (topic) {
      assert.instanceOf(topic.emitter, EventEmitter);
    },
    'call `soonEmit`': {
      topic: function (parent) {
        var emitter = parent.emitter;
        emitter.soonEmit('success');
        emitter.soonEmit('end', 1);
        emitter.soonEmit('connect', 'hello', {});
        return emitter;
      },
      on: {
        'success': {
          'should be `undefined`': function (arg1) {
            assert.isUndefined(arg1);
          }
        },
        'end': {
          'should be `1`': function (arg1) {
            assert.equal(arg1, 1);
          }
        },
        'connect': {
          'first argument should be `hello`': function (arg1) {
            assert.equal(arg1, 'hello');
          },
          'second argument should be `{}`': function (err, arg1, arg2) {
            console.log(arg1, arg2);
            assert.isEmpty(arg2);
          }
        },
      }
    },
  }
}).export(module);

