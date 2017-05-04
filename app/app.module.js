/**
 * Components
 */
require('./controllers/authentication/authentication.module');
require('./controllers/authentication/authentication.component');

/**
 * Various App Configuration
 */
angular.module('grandsler-payroll-system', [
  'ngRoute',
  'authentication',
  'ngMaterial'
]).config(['$locationProvider', '$routeProvider', '$mdIconProvider', ($locationProvider, $routeProvider, $mdIconProvider) => {

  // Just following a good convention.
  $locationProvider.hashPrefix('!');

  // Main Router Logic
  $routeProvider
    .when('/log-in', {
      template: '<log-in></log-in>'
    })
    .otherwise('/log-in');

  // Icon Provider
  $mdIconProvider.iconSet('action', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-action.svg');
  $mdIconProvider.iconSet('social', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-social.svg');
}]);

/**
 * For live-reload.
 */
if (process.env.NODE_ENV === 'development')
  require('electron-connect').client.create();
