/**
 * Singleton authentication module.
 */
const {User, Employee, Employment, Sequelize} = require('../index');

let auth = {
  /**
   * The current authenticated user.
   * This variable is set if authentication attempt is successful.
   */
  user: null,

  /**
   * Attempts to authenticate the given username and password against the database.
   * The user must have its is_enabled set to 1 in order to be authenticated.
   * The is_enabled is automatically invalidated if the employee is inactive (i.e. when an employee is not hired).
   * @param username
   * @param password
   * @param _options Optional parameter. Transaction may be included here.
   * @returns {Promise} With user as its parameter in Promise.resolve.
   */
  attempt: (username, password, _options) =>
  {
    let options = Object.assign({
      where: {
        username: username,
        password: password,
        is_enabled: true
      },
      include: [{
        model: Employee,
        include: [{
          model: Employment,
          where: {
            date_hired: {
              $lte: Sequelize.fn('CURDATE')
            },
            date_released: {
              $or: {
                $gte: Sequelize.fn('CURDATE'),
                $eq: null
              }
            }
          },
          required: false
        }]
      }]
    }, _options);

    return User.findOne(options).then(user => {
      if (user != null && (user.Employee == null || user.Employee.Employments.length > 0))
        return auth.user = user;
      return Promise.reject();
    });
  }
};

module.exports = auth;