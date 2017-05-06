const auth = require('../../models/domain/authentication');

angular.module('change-password')
  .component('changePassword', {
    templateUrl: './components/change_password/change_password.template.html',
    controller: ['$scope', '$mdDialog', function($scope, $mdDialog) {

      this.current_user = auth.user;

      this.save = function(options) {
        auth.user.password = this.new_password;
        return auth.user.save(options);
      };

      this.cancel = function() {
        $mdDialog.hide();
      }
    }]
  });