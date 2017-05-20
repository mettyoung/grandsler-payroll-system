/**
 * Components
 */
require('./components/main_app/main_app.module');
require('./components/main_app/main_app.component');
require('./components/authentication/authentication.module');
require('./components/authentication/authentication.component');

const customComponents = [
  'main-app',
  'authentication'
];

const appDependencies = [
  'ui.router'
];

angular.module('grandsler-payroll-system', [
  ...customComponents,
  ...appDependencies
]);


/**
 * For live-reload and state visualizer.
 */
if (process.env.NODE_ENV === 'development')
{
  angular.module('grandsler-payroll-system').run(function($uiRouter) {
    $uiRouter.plugin(require('@uirouter/visualizer').Visualizer);
  });
}