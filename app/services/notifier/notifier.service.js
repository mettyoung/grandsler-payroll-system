/**
 * Import the authentication module from renderer process, if not from main process.
 */
const {remote} = require('electron');
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

  /**
   * Store injected dependencies.
   * @param $mdToast
   */
  constructor($mdToast) {
    this.$mdToast = $mdToast;
  }

  /**
   * Creates a function that executes its callback after which returns a promise containing a {Message} object,
   * saves the {Message} object to the database for logging purposes, shows a system-wide toast
   * and updates the activity logs if present.
   * @param callback The callback function that should return a Promise with {Message} object.
   * @param options Additional options to be applied for database saving (e.g. transaction).
   * @returns {Function} A function that includes calling of notifier services.
   */
  register(callback, options) {
    return () => {
      return callback().then(message => {
        message.user_id = auth.user.id;
        return UserLog.create(message, options)
        // These will be skipped if UserLog failed.
          .then(userLog => {
            this.$mdToast.show(
              this.$mdToast.simple()
                .textContent('Saved!')
                .action('close')
                .highlightAction(true)
                .hideDelay(3000)
            );
            return message;
          });
      })
    }
  }
}

/**
 * Register the Notifier service to Angular.
 */
angular.module('notifier')
  .service('Notifier', ['$mdToast', Notifier]);