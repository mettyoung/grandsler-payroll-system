angular.module('action-bar')
  .component('actionBar', {
    templateUrl: './components/action_bar/action_bar.template.html',
    bindings: {
      title: '<',
      onMenuPressed: '&'
    },
    controller: ['$mdDialog', 'ModelProvider', '$state', function ($mdDialog, ModelProvider, $state)
    {
      this.auth = ModelProvider.auth;

      this.openChangePasswordDialog = () =>
      {
        $mdDialog.show({
          template: '<md-dialog aria-label="Change password dialog." flex="40"><change-password></change-password></md-dialog>'
        });
      };

      this.openSalaryCriteriaDialog = function ()
      {
        $mdDialog.show({
          template: '<md-dialog aria-label="Salary criteria registry dialog." flex="60"><salary-criteria-registry></salary-criteria-registry></md-dialog>'
        });
      };

      this.openSettingsDialog = function ()
      {
        $mdDialog.show({
          template: '<md-dialog aria-label="Settings dialog." flex="60"><settings></settings></md-dialog>'
        });
      };
      
      this.logOut = function() 
      {
        ModelProvider.auth.logOut();
        $state.go('authentication');
      };
    }]
  });