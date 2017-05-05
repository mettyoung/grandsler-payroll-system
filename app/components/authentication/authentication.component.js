angular.module('authentication')
  .component('authentication', {
    templateUrl: './components/authentication/authentication.template.html',
    controller: ['Loader', '$scope', '$state', function (Loader, $scope, $state) {
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
          .then(() => $scope.$apply())
          .then(() => {
            if(this.isAuthenticated)
              $state.go('main-app')
          });
      };
    }]
  });