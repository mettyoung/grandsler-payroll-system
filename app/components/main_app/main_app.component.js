angular.module('main-app')
  .component('mainApp', {
    templateUrl: './components/main_app/main_app.template.html',
    controller: ['$mdSidenav', function($mdSidenav)
    {
      this.title = 'Grandsler Payroll System';

      this.openNavigationBar = () =>
      {
        $mdSidenav('left').open();
      };
      
      this.onMenuItemPressed = module =>
      {
        this.title = module.name;
        $mdSidenav('left').close();
      }
    }]
  });