angular.module('navigation-bar')
  .component('navigationBar', {
    templateUrl: './components/navigation_bar/navigation_bar.template.html',
    controller: function()
    {
      this.modules = [
        {
          name: 'User Management',
          icon: "social:ic_person_24px"
        },
        {
          name: 'Employee Management',
          icon: "social:ic_group_24px"
        }
      ];
    }
  });