angular.module('authentication')
  .component('logIn', {
    templateUrl: './modules/authentication/authentication.template.html',
    controller: ['Loader', function(Loader)
    {
      this.login = event =>
      {
        Loader.perform(event.target, () =>
        {
          return require('../../models/domain/authentication')
            .attempt(this.username, this.password)
            .then(() => alert("Log-in successful!"))
            .catch(() => alert("Log-in failed!"));
        });
      };
    }]
  });