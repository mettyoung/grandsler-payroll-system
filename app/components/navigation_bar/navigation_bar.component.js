angular.module('navigation-bar')
  .component('navigationBar', {
    templateUrl: './components/navigation_bar/navigation_bar.template.html',
    bindings: {
      onMenuItemPressed: '&'
    },
    controller: ['$state', function($state)
    {
      /**
       * Modules
       */
      this.modules = [
        {
          name: 'Employee Management',
          icon: "social:ic_group_24px",
          state_name: 'main_app.employee_management'
        }
      ];

      /**
       * Change the state.
       * @param module
       */
      this.selectModule = module => 
      {
        $state.go(module.state_name);
        this.onMenuItemPressed({value: module});
      }
    }]
  });