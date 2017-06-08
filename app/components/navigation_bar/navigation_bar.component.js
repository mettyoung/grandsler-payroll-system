angular.module('navigation-bar')
  .component('navigationBar', {
    templateUrl: './components/navigation_bar/navigation_bar.template.html',
    bindings: {
      onMenuItemPressed: '&'
    },
    controller: ['$state', 'ModelProvider', function($state, ModelProvider)
    {
      /**
       * Modules
       */
      this.modules = [
        {
          name: 'Employee Management',
          icon: "social:ic_group_24px",
          state_name: 'main_app.employee_management'
        },
        {
          name: 'Production Order',
          icon: "hardware:ic_power_input_24px",
          state_name: 'main_app.production_order'
        }
      ];

      this.modules = this.modules.map(module => {
        module.is_authorized = ModelProvider.auth.user.hasPermission(module.name);
        return module;
      });
      
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