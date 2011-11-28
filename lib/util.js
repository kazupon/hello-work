/**
 * util.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var EventEmitter = require('events').EventEmitter;


// 
// extend(s)
//

/**
 * @method soonEmit
 * @param {string} event an event name.
 * @param arg1 first argument.
 * @param arg2 second argument.
 * ...
 * @return {Boolean} true -> success, false -> fail
 **/
EventEmitter.prototype.soonEmit = function (/* event, arg1, arg2, .. */) {
  if (arguments.length === 0) {
    return false;
  }
  var self = this;
  var args = arguments;
  process.nextTick(function () {
    self.emit.apply(self, args);
  });
  return true;
};


/**
 * assert 
 * @function assert
 * @param {Boolean} condition The condition result.
 * @param {String} message The assert message.
 */
function assert (condition, message) {
  if (!condition) {
    console.log('Assertsion Failure');
    if (message) {
      console.log('Message: %s', message);
    }
    console.trace();
    if (Error().stack) {
      console.error(Error().stack);
    }
    debugger;
    return false;
  } else {
    return true;
  }
}


// 
// export(s)
//

module.exports = {
  assert: assert,
  EventEmitter: EventEmitter
}

