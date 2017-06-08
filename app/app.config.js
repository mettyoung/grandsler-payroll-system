angular.module('grandsler-payroll-system')
  .config(['$stateProvider', $stateProvider =>
  {
    $stateProvider.state({
      name: 'authentication',
      url: '/authentication',
      component: 'authentication'
    });

    $stateProvider.state({
      name: 'main_app',
      url: '/main_app',
      component: 'mainApp'
    });

    $stateProvider.state({
      name: 'main_app.employee_management',
      url: '/main_app/employee_management',
      component: 'employeeManagement'
    });

    $stateProvider.state({
      name: 'main_app.production_order',
      url: '/main_app/production_order',
      component: 'productionOrder'
    });
  }]);