/**
 * Components
 */
require('./components/authentication/authentication.module');
require('./components/authentication/authentication.component');

/**
 * Various App Configuration
 */
angular.module('grandsler-payroll-system', [
  'ngRoute',
  'authentication',
  'ngMaterial',
  'ui.router'
]).config(['$routeProvider', '$mdIconProvider', ($routeProvider, $mdIconProvider) => {

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
 * For live-reload and state visualizer.
 */
if (process.env.NODE_ENV === 'development')
{
  require('electron-connect').client.create();
  angular.module('grandsler-payroll-system').run(function($uiRouter) {
    $uiRouter.plugin(require('@uirouter/visualizer').Visualizer);
  });
}
