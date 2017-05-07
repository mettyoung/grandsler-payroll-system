const { remote } = require('electron');
const auth = remote && remote.require('./models/domain/authentication') ||
  require('../../models/domain/authentication');

angular.module('change-password')
  .component('changePassword', {
    templateUrl: './components/change_password/change_password.template.html',
    controller: ['$scope', '$mdDialog', function($scope, $mdDialog) {

      this.current_user_password = auth.user.password;

      this.save = function(options) {
        auth.user.password = this.new_password;
        return auth.user.save(options)
          .then(user => {
            this.cancel();
            return user;
          })
          .catch(error => this.error = error);
      };

      this.cancel = function() {
        $mdDialog.hide();
      };
    }]
  });