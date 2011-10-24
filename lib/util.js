/**
 * util.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

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

module.exports.assert = assert;

