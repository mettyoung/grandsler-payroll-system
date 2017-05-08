angular.module('navigation-bar')
  .component('navigationBar', {
    templateUrl: './components/navigation_bar/navigation_bar.template.html',
    controller: function($scope, $mdDialog)
    {
      $scope.openChangePasswordDialog = () => {
        $mdDialog.show({
          template: '<md-dialog aria-label="Change password dialog." flex="40"><change-password></change-password></md-dialog>'
        });
      };

      $scope.openSalaryCriteriaDialog = function() {

      };

      $scope.openTimeShiftRegistryDialog = function() {

      };
    }
  });