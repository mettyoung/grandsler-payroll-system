angular.module('authentication')
  .component('logIn', {
    templateUrl: './controllers/authentication/authentication.template.html',
    controller: ['Loader', '$scope', function (Loader, $scope) {
      /**
       * Login method of the controller.
       * @param event Contains the event object.
       * @returns {Promise}.
       */
      this.login = event => {
        return Loader.perform(event.target, () => {
          return require('../../models/domain/authentication')
            .attempt(this.username, this.password)
        }).then(() => this.isAuthenticated = true)
          .catch(() => this.isAuthenticated = false)
          .then(() => $scope.$apply());
      };
    }]
  });