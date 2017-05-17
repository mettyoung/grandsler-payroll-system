/**
 * Setup the requirements for the dom manipulation.
 */
const {inject, ngModule} = require('./angular_test_setup');
global.inject = inject;
global.ngModule = ngModule;

/**
 * Assertion library.
 */
require('./chai_with_promised');

/**
 * Moment for date manipulation.
 */
global.moment = require('moment');