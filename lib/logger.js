/**
 * logger.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//

var log4js = require('log4js');
var format = require('util').format;


// 
// variable(s)
//
var logger = log4js.getLogger();


//
// function(s)
//


/**
 * Set a logging level.
 * @function setLevel
 * @param {String} level A logging level
 * @returns {Boolean} success : true, fail : false
 */
function setLevel (level) {
  if (!level || (typeof level) !== 'string') {
    return false;
  }
  var ret = false;
  try {
    logger.setLevel(level);
    ret = true;
  } catch (e) {
    console.error(e.message);
  }
  return ret;
}

/**
 * @function configure
 * @param {Object} options A setting options
 * @returns {Boolean} success : true, fail : false
 */
function configure (options) {
  if (!options) {
    return false;
  }
  var ret = false;
  try {
    log4js.configure(options);
    logger = log4js.getLogger(); // update
    ret = true;
  } catch (e) {
    console.error(e.message);
  }
  return ret;
}

/**
 * Trace a log
 * @function trace
 * @param args A variable arguments
 * @returns {Boolean} success : true, fail : false
 */
function trace (/* args */) {
  var ret = false;
  try {
    logger.trace(format.apply(this, arguments));
    ret = true;
  } catch (e) {
    console.error(e.message);
  }
  return ret;
}

function debug (/* args */) {
  throw new Error('Not Implemented');
}

function info (/* args */) {
  throw new Error('Not Implemented');
}

function warn (/* args */) {
  throw new Error('Not Implemented');
}

function error (/* args */) {
  throw new Error('Not Implemented');
}

function fatal (msg) {
  throw new Error('Not Implemented');
}


//
// export(s)
//

module.exports = {
  setLevel: setLevel,
  configure: configure,
  trace: trace,
  debug: debug,
  info: info,
  warn: warn,
  error: error,
  fatal: fatal,
};
