angular.module('grandsler-payroll-system')
  .config(['$stateProvider', $stateProvider =>
  {
    $stateProvider.state({
      name: 'main_app',
      url: '/main_app',
      component: 'mainApp'
    });

    $stateProvider.state({
      name: 'main_app.user_management',
      url: '/main_app/user_management',
      component: 'userManagement'
    });

    $stateProvider.state({
      name: 'main_app.employee_management',
      url: '/main_app/employee_management',
      component: 'employeeManagement'
    });
  }]);