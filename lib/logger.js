/**
 * logger.js
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */


//
// import(s)
//

function configure (options) {
  throw new Error('Not Implemented');
}

function trace (/* args */) {
  throw new Error('Not Implemented');
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
  configure: configure,
  trace: trace,
  debug: debug,
  info: info,
  warn: warn,
  error: error,
  fatal: fatal,
};
