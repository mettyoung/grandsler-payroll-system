const auth = require('../../models/domain/authentication');

angular.module('authentication')
  .component('logIn', {
    templateUrl: './modules/authentication/authentication.template.html',
    controller: function()
    {
      this.login = () =>
      {
        auth.attempt(this.username, this.password)
          .then(() => alert("Log-in successful!"))
          .catch(() => alert("Log-in failed!"));
      };
    }
  });
