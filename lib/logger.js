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


function logCore (func) {
  var ret = false;
  try {
    func();
    ret = true;
  } catch (e) {
    console.error(e.message);
  }
  return ret;
}


/**
 * Set a logging level.
 * @function setLevel
 * @param {String} level A logging level
 * @returns {Boolean} success : true, fail : false
 */
function setLevel (level) {
  // TODO: should be check level kind !!
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
  var ret = false;
  try {
    if (!options) {
      log4js.clearAppenders();
    } else {
      log4js.clearAppenders();
      log4js.configure(options);
    }
    logger = log4js.getLogger(); // update
    ret = true;
  } catch (e) {
    console.error(e.message);
  }
  return ret;
}

/**
 * Output a trace log
 * @function trace
 * @param args A variable arguments
 * @returns {Boolean} success : true, fail : false
 */
function trace (/* args */) {
  var self = this;
  var args = arguments;
  return logCore(function () {
    logger.trace(format.apply(self, args));
  });
}

/**
 * Output a debug log
 * @function debug
 * @param args A variable arguments
 * @returns {Boolean} success : true, fail : false
 */
function debug (/* args */) {
  var self = this;
  var args = arguments;
  return logCore(function () {
    logger.debug(format.apply(self, args));
  });
}

/**
 * Output an infomation log
 * @function info
 * @param args A variable arguments
 * @returns {Boolean} success : true, fail : false
 */
function info (/* args */) {
  var self = this;
  var args = arguments;
  return logCore(function () {
    logger.info(format.apply(self, args));
  });
}

/**
 * Output a warning log
 * @function warn
 * @param args A variable arguments
 * @returns {Boolean} success : true, fail : false
 */
function warn (/* args */) {
  var self = this;
  var args = arguments;
  return logCore(function () {
    logger.warn(format.apply(self, args));
  });
}

/**
 * Output an error log
 * @function error
 * @param args A variable arguments
 * @returns {Boolean} success : true, fail : false
 */
function error (/* args */) {
  var self = this;
  var args = arguments;
  return logCore(function () {
    logger.error(format.apply(self, args));
  });
}

/**
 * Output an fatal error log
 * @function fatal
 * @param args A variable arguments
 * @returns {Boolean} success : true, fail : false
 */
function fatal (/* args */) {
  var self = this;
  var args = arguments;
  return logCore(function () {
    logger.fatal(format.apply(self, args));
  });
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
