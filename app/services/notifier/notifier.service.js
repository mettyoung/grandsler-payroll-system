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
  constructor($mdToast)
  {
    this.$mdToast = $mdToast;
    this.listeners = [];
  }

  /**
   * Executes its callback after which returns a promise containing a {Message} object,
   * saves the {Message} object to the database for logging purposes, shows a system-wide toast
   * and updates the activity logs if present.
   * @param callback The callback function that should return a Promise with {Message} object.
   * @param options Additional options to be applied for database saving (e.g. transaction).
   * @returns {Promise} Returns the {Message} object with user_id if successful.
   */
  perform(callback, options)
  {
    return callback().then(message =>
    {
      message.user_id = auth.user.id;

      const mainChain = UserLog.create(message, options)
      // These will be skipped if UserLog failed.
        .then(userLog =>
        {
          this.$mdToast.show(
            this.$mdToast.simple()
              .textContent('Saved!')
              .action('close')
              .highlightAction(true)
              .hideDelay(3000)
          );

          return Object.assign(userLog.get({plain: true}), {
            username: auth.user.username
          });
        });

      // Add dynamically these listeners.
      for (let listener of this.listeners)
        mainChain.then(listener);

      return mainChain;
    });
  }

  /**
   * Adds a listener to be executed after the successful operation.
   * @param callback The callback to be executed.
   */
  addListener(callback)
  {
    this.listeners.push(callback);
  }
}

/**
 * Register the Notifier service to Angular.
 */
angular.module('notifier')
  .service('Notifier', ['$mdToast', Notifier]);