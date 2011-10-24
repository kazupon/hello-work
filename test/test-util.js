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


var suite = vows.describe('util.js tests');
suite.addBatch({
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
