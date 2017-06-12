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
      views: {
        '': {
          component: 'mainApp',
          resolve: {
            layout: () => 'column',
            flex: () => 100
          }
        },
        'right-side-nav@main_app': {
          template: `
            <md-sidenav class="md-sidenav-right md-whiteframe-4dp" md-component-id="right"
                        md-is-locked-open="$mdMedia('gt-sm')">
                <activity-logs flex></activity-logs>
            </md-sidenav>`
        }
      }
    });

    $stateProvider.state({
      name: 'main_app.employee_management',
      url: '/main_app/employee_management',
      component: 'employeeManagement'
    });

    $stateProvider.state({
      name: 'main_app.production_order',
      url: '/main_app/production_order',
      views: {
        '': {
          component: 'productionOrder',
          resolve: {
            layout: () => 'column',
            flex: () => 100
          }
        },
        'right-side-nav@main_app': {
          template: ''
        }
      }
    });
  }]);