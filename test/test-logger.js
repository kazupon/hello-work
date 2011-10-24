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


//
// test(s)
//

var suite = vows.describe('logger.js tests');
suite.addBatch({
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
      'should be failed': function (res) {
        assert.ok(!res);
      },
    },
    // TODO: should be check other parameter patterns.
  },
  'trace': withCases([
    [ trace, true, [ 'hello world' ] ],
    [ trace, true, [ 1 ] ],
    [ trace, true, [ null ] ],
    [ trace, true, [ undefined ] ],
    [ trace, true, [ function () {} ] ],
    [ trace, true, [ { hello: 'world' } ] ],
    [ trace, true, [ Array ] ],
    [ trace, true, [ new Error('error') ] ],
    [ trace, true, [ 'hello', 'world' ] ],
    [ trace, true, [ 1, 2 ] ],
    [ trace, true, [ 'hello', 2 ] ],
    [ trace, true, [ null, 'hello' ] ],
    [ trace, true, [ '%d', 1 ] ],
    [ trace, true, [ '%s', 'hello' ] ],
    [ trace, true, [ '%j', { hello: 'world' } ] ],
  ]),
  /*
  'trace': withArgumentAndReturn(trace, 'hello world', true),
  'debug': withArgumentAndReturn(debug, 'hello world', true),
  'info': withArgumentAndReturn(info, 'hello world', true),
  'warn': withArgumentAndReturn(warn, 'hello world', true),
  'error': withArgumentAndReturn(error, 'hello world', true),
  'fatal': withArgumentAndReturn(fatal, 'hello world', true),
  */
}).export(module);
