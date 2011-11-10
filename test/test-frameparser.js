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


// 
// test(s)
//

var suite = vows.describe('client.js tests');
suite.addBatch({
  'A `FrameParser` instance with default constructor': {
    topic: new FrameParser(),
    'should be `\\n`': function (topic) {
      assert.equal(topic.demiliter, '\n');
    },
  },
  'A `FrameParser` instance with demiliter constructor': {
    topic: new FrameParser('\n'),
    'should be `\\n`': function (topic) {
      assert.equal(topic.demiliter, '\n');
    },
  },
}).addBatch({
  'call `expand`': {
    topic: function () {
      return function (data) {
        return new FrameParser().expand(data);
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
      },
    },
    'with `null` illegal data': {
      topic: function (parent) {
        return parent(null);
      },
      'should be `null`': function (topic) {
        assert.isNull(topic);
      },
    },
    // TODO: should tested many illegal data !!
  },
  'call `shrink`': {
    topic: function () {
      return function (frame) {
        return new FrameParser().shrink(frame);
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
      },
    },
    'with `null` data': {
      topic: function (parent) {
        return parent(null);
      },
      'should returned `null`': function (topic) {
        assert.isNull(topic);
      },
    },
    // TODO: should tested many illegal data !!
  },
}).export(module);
