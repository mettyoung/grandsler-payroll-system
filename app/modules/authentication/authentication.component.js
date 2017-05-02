angular.module('authentication')
  .component('logIn', {
    templateUrl: './modules/authentication/authentication.template.html',
    controller: function()
    {
      this.login = () =>
      {
        require('../../models/domain/authentication')
          .attempt(this.username, this.password)
          .then(() => alert("Log-in successful!"))
          .catch(() => alert("Log-in failed!"));
      };
    }
  });
