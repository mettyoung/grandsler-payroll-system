const auth = require('../../models/domain/authentication');

angular.module('change-password')
  .component('changePassword', {
    templateUrl: './components/change_password/change_password.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider', function ($scope, $mdDialog, Notifier, ModelProvider)
    {
      this.current_user_password = auth.user.password;

      /**
       * Saves the changed password and logs to user logs.
       * @param transaction to be passed in tests.
       * @returns {Promise}
       * @private
       */
      const _save = (transaction) =>
      {
        auth.user.password = this.new_password;
        return Notifier.perform(() =>
          auth.user.save({transaction: transaction}).then(() =>
          {
            return {
              module: 'Account Settings',
              description: 'Changed password successfully!'
            };
          }, transaction)
        );
      };


      /**
       * Used to only allow one save at a time.
       * @type {boolean}
       */
      let isSaveIdle = true;

      /**
       * Saves the changed password.
       * @param transaction
       * @returns {Promise} if executed; {undefined} otherwise.
       */
      this.save = (transaction) =>
      {
        if (isSaveIdle)
        {
          isSaveIdle = false;
          let transactionPromise;
          if (transaction)
            transactionPromise = _save(transaction);
          else
            transactionPromise = ModelProvider.sequelize.transaction(_save);

          return transactionPromise.then(() =>
          {
            this.cancel();
            this.save_error = null;
          }).catch(error =>
          {
            this.save_error = error;
            auth.user.reload();
          }).then(() => $scope.$apply())
            .then(() => isSaveIdle = true)
        }
      };

      /**
       * Hides the dialog.
       * @returns {Promise}
       */
      this.cancel = function ()
      {
        $mdDialog.hide();
      };
    }]
  });