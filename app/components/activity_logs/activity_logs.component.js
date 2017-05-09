const moment = require('moment');
const capitalize = require('lodash.capitalize');
const {User, UserLog} = require('../../models/persistence/index');

angular.module('activity-logs')
  .component('activityLogs', {
    templateUrl: './components/activity_logs/activity_logs.template.html',
    controller: ['Notifier', function (Notifier)
    {
      /**
       * Formats the userLog object to be presented to the view template.
       * @param userLog from the database.
       * @returns {{date: (*|string), description: string}}
       */
      this.format = function(userLog) {
        return {
          date: moment(userLog.created_at).format("MMMM Do YYYY, hh:mm:ss a"),
          description: `${capitalize(userLog.User.username)} ${userLog.description.toLowerCase()}`
        }
      };

      /**
       * Initialize view model properties.
       * @type {Array}
       */
      this.activities = [];

      /**
       * Loads user logs from the database and formats it.
       * @param _options
       * @returns {Promise} Returns the updated activities.
       */
      this.load = (_options) =>
      {
        const options = Object.assign({ include: [User] }, _options);

        return UserLog.findAll(options).then(userLogs => this.activities =
          [...this.activities, ...userLogs.map(this.format)]);
      };

      /**
       * Initializations
       */

      /**
       * Preload the activities.
       */
      this.load();

      /**
       * Adds a listener for the notifier event if a user action is committed, the activity logs must be updated.
       * This also formats the activities.
       */
      Notifier.addListener(userLog => this.activities.push(this.format(userLog)));
    }]
  });