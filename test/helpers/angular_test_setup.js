/**
 * Extracted from https://gist.github.com/rikukissa/dcb422eb3b464cc184ae.
 */
require('jsdom-global')();

/*
 * angular-mocks
 */

global.window.mocha = {};
global.window.beforeEach = global.beforeEach;
global.window.afterEach = global.afterEach;

/*
 * Since angular and angular-mocks are both singletons created once with one window-object
 * and mocha doesn't reload modules from node_modules on watch mode we'll have to
 * invalidate the cached singletons manually.
 */

delete require.cache[require.resolve('angular')];
delete require.cache[require.resolve('angular/angular')];
delete require.cache[require.resolve('angular-mocks')];

global.$ = global.window.jQuery = require('jquery');
require('angular/angular');
global.angular = global.window.angular;

require('angular-mocks');
require('angular-animate');
require('angular-messages');
require('angular-aria');
require('angular-material');
require('@uirouter/angularjs');

module.exports = {
  inject: global.window.angular.mock.inject,
  ngModule: global.window.angular.mock.module
};