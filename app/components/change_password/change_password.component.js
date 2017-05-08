const {remote} = require('electron');
const auth = remote && remote.require('./models/domain/authentication') ||
  require('../../models/domain/authentication');

angular.module('change-password')
  .component('changePassword', {
    templateUrl: './components/change_password/change_password.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', function ($scope, $mdDialog, Notifier) {

      this.current_user_password = auth.user.password;

      this.save = (options) => {
        return Notifier.perform(() => {
          auth.user.password = this.new_password;
          return auth.user.save(options)
            .then(user => {
              this.cancel();
              return {
                module: 'Account Settings',
                description: 'Changed password successfully!'
              };
            })
        }, options).catch(error => {
          this.error = error;
          $scope.$apply();
          auth.user.reload();
        });
      };

      this.cancel = function () {
        $mdDialog.hide();
      };
    }]
  });