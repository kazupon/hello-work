/**
 * test-logger.js
 * @fileoverview logger.js tests
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
// 

var vows = require('vows');
var assert = require('assert');
var format = require('util').format;
var logger = require('../lib/logger');
Object.keys(logger).forEach(function (func) {
  this[func] = logger[func];
});


//
// common(s)
//

function assertResult (actual) {
  return function (res) {
    assert.equal(actual, res);
  };
}

function withContext (func, ret, args) {
  var topic_context = {
    topic: func.apply(func, args),
  };
  var desc = format('`%s` should be returned', String(ret));
  topic_context[desc] = assertResult(ret);
  var params_context = {
  };
  var params_desc = 'with ';
  for (var i = 0; i < args.length; i++) {
    params_desc = params_desc + '`' + String(args[i]) + '`';
    if (i !== args.length - 1) {
      params_desc = params_desc+ ', ';
    }
  }
  params_context[params_desc] = topic_context;
  return params_context;
}

function withCases (cases) {
  var tests = {};
  cases.forEach(function (items) {
    var context = withContext(items[0], items[1], items[2]);
    Object.keys(context).forEach(function (key) {
      tests[key] = context[key];
    });
  });
  return tests;
}

function withCommonTests (func) {
  configure({ "appenders": [ { "type": "console" } ] });
  return withCases([
    [ func, true, [ 'hello world' ] ],
    [ func, true, [ 1 ] ],
    [ func, true, [ null ] ],
    [ func, true, [ undefined ] ],
    [ func, true, [ function () {} ] ],
    [ func, true, [ { hello: 'world' } ] ],
    [ func, true, [ Array ] ],
    [ func, true, [ new Error('error') ] ],
    [ func, true, [ 'hello', 'world' ] ],
    [ func, true, [ 1, 2 ] ],
    [ func, true, [ 'hello', 2 ] ],
    [ func, true, [ null, 'hello' ] ],
    [ func, true, [ '%d', 1 ] ],
    [ func, true, [ '%s', 'hello' ] ],
    [ func, true, [ '%j', { hello: 'world' } ] ],
    // TODO: should be check other parameter patterns.
  ]);
}

//
// test(s)
//

var suite = vows.describe('logger.js tests');
suite.addBatch({
  'setLevel': withCases([
    [ setLevel, true, [ 'DEBUG' ] ],
    [ setLevel, false, [ 1 ] ],
    [ setLevel, false, [ null ] ],
    // TODO: should be check other parameter patterns.
  ]), 
  'configure': {
    'with specific setting object': {
      topic: configure({
        "appenders": [
          {
            "type": "console"
          },
          {
            "type": "file",
            "filename": "./system.log",
            "maxLogSize": 1024,
            "backups": 3
          },
          {
            "type": "file",
            "filename": "./access.log",
            "maxLogSize": 1024,
            "backups": 10,
            "category": "access"
          }
        ]
      }),
      'should be success': function (res) {
        assert.ok(res);
      },
    },
    'with null': {
      topic: configure(null),
      'should be success': function (res) {
        assert.ok(res);
      },
    },
    // TODO: should be check other parameter patterns.
  },
  'trace': withCommonTests(trace),
  'debug': withCommonTests(debug),
  'info': withCommonTests(info),
  'warn': withCommonTests(warn),
  'error': withCommonTests(error),
  'fatal': withCommonTests(fatal),
}).export(module);
