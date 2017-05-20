angular.module('main-app')
  .component('mainApp', {
    templateUrl: './components/main_app/main_app.template.html',
    controller: ['$mdSidenav', function($mdSidenav)
    {
      this.title = 'Hello Foo Bar';
      this.openNavigationBar = () =>
      {
        $mdSidenav('left').open();
      };
      
      this.closeNavigationBar = () => 
      {
        $mdSidenav('left').close();
      }
    }]
  });