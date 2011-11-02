/**
 * helper.js
 * @fileoverview helper libraries
 * @author kazuya kawaguchi <kawakazu80@gmail.com>
 */

//
// import(s)
//
var Agent = require('../lib/agent').Agent;


function whenServerRunning (port, target) {
  var top_context = {};
  var top_context_properties = {};
  top_context_properties.topic = function () {
    var agent = new Agent();
    agent.start(port, function () {
      console.log('start hellowork server ...');
    });
    return agent;
  };
  Object.keys(target).forEach(function (context) {
    top_context_properties[context] = target[context];
  });
  top_context_properties.teardown = function (agent) {
    agent.stop(function () {
      console.log('... stop hellowork server');
    });
  };
  top_context['When `hellowork` server running,'] = top_context_properties;
  return top_context;
}


module.exports = {
  whenServerRunning: whenServerRunning
};

