angular.module('action-bar')
  .component('actionBar', {
    templateUrl: './components/action_bar/action_bar.template.html',
    bindings: {
      title: '<',
      onMenuPressed: '&'
    },
    controller: ['$mdDialog', 'ModelProvider', function ($mdDialog, ModelProvider)
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
          template: '<md-dialog aria-label="Salary criteria registry dialog." flex="40"><salary-criteria-registry></salary-criteria-registry></md-dialog>'
        });
      };

      this.openTimeShiftRegistryDialog = function ()
      {
        $mdDialog.show({
          template: '<md-dialog aria-label="Time-shift registry dialog." flex="80"><time-shift-registry></time-shift-registry></md-dialog>'
        });
      };
    }]
  });