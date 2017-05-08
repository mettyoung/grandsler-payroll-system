/**
 * Import the authentication module from renderer process, if not from main process.
 */
const { remote } = require('electron');
const auth = remote && remote.require('./models/domain/authentication') ||
  require('../../models/domain/authentication');

/**
 * ORM for UserLog
 */
const {UserLog} = require('../../../app/models/persistence/index');

/**
 * Responsible for saving the {Message} object describing the user action to the database for logging purposes,
 * showing a system-wide toast and updating the activity logs if present.
 */
class Notifier {

  register(callback, options) {
    return function(){
      return callback().then(message => {
        message.user_id = auth.user.id;
        return UserLog.create(message, options)
          // These will be skipped if UserLog failed.
          .then(userLog => message);
      })
    }
  }
}

/**
 * Register the Notifier service to Angular.
 */
angular.module('notifier')
  .service('Notifier', Notifier);