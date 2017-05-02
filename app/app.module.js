require('./modules/authentication/authentication.module');
require('./modules/authentication/authentication.component');

angular.module('grandsler-payroll-system', [
  'ngRoute',
  'authentication'
]).config(['$locationProvider', '$routeProvider',
  ($locationProvider, $routeProvider) => {
    $locationProvider.hashPrefix('!');

    $routeProvider
      .when('/log-in', {
        template: '<log-in></log-in>'
      })
      .otherwise('/log-in');
  }
]);

if (process.env.NODE_ENV === 'development')
  require('electron-connect').client.create();
