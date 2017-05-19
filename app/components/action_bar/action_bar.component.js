angular.module('action-bar')
  .component('actionBar', {
    templateUrl: './components/action_bar/action_bar.template.html',
    controller: function($scope, $mdDialog)
    {
      $scope.openChangePasswordDialog = () => {
        $mdDialog.show({
          template: '<md-dialog aria-label="Change password dialog." flex="40"><change-password></change-password></md-dialog>'
        });
      };

      $scope.openSalaryCriteriaDialog = function() {
        $mdDialog.show({
          template: '<md-dialog aria-label="Salary criteria registry dialog." flex="40"><salary-criteria-registry></salary-criteria-registry></md-dialog>'
        });
      };

      $scope.openTimeShiftRegistryDialog = function() {
        $mdDialog.show({
          template: '<md-dialog aria-label="Time-shift registry dialog." flex="80"><time-shift-registry></time-shift-registry></md-dialog>'
        });
      };
    }
  });