angular.module('main-app')
  .component('mainApp', {
    templateUrl: './components/main_app/main_app.template.html',
    controller: function()
    {
      this.title = 'Hello Foo Bar';
    }
  });