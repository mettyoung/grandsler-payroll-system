/**
 * Setup the requirements for the dom manipulation.
 */
const {inject, ngModule} = require('./angular_test_setup');
global.inject = inject;
global.ngModule = ngModule;

/**
 * Get the DB transaction helper.
 */
global.transactionScope = require('./transaction_scope');

/**
 * Filesystem
 */
global.fs = require('fs');
