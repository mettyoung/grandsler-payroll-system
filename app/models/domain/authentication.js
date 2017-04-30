/**
 * Singleton authentication module.
 */
const {User} = require('../index');

let auth = {
  /**
   * The current authenticated user.
   * This variable is set if authentication attempt is successful.
   */
  user: null,

  /**
   * Attempts to authenticate the given username and password against the database.
   * The user must have its is_enabled set to 1 in order to be authenticated.
   * The is_enabled is automatically invalidated if the employee is inactive (i.e. when an employee is released).
   * @param username
   * @param password
   * @param _options Optional parameter. Transaction may be included here.
   * @returns {Promise} With user as its parameter.
   */
  attempt: (username, password, _options) =>
  {
    let options = Object.assign({
      where: {
        username: username,
        password: password,
        is_enabled: true
      }
    }, _options);

    return User.findOne(options).then(user => {
      if (user != null)
        return auth.user = user;
      return Promise.reject();
    });
  }
};

module.exports = auth;