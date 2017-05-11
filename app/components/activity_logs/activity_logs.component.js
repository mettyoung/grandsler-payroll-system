const moment = require('moment');
const capitalize = require('lodash.capitalize');
const {User, UserLog} = require('../../models/persistence/index');

angular.module('activity-logs')
  .component('activityLogs', {
    templateUrl: './components/activity_logs/activity_logs.template.html',
    controller: ['Notifier', '$scope', function (Notifier, $scope)
    {
      /**
       * Sets the default entries to load
       */
      const DEFAULT_NUMBER_OF_ENTRIES = 10;

      /**
       * Refresh rate
       */
      const REFRESH_RATE_IN_SECONDS = 5;

      /**
       * Variables to be used for the algorithm of preloading, loading of older and filling of the newer logs.
       */
      let olderActivities = [];
      let mostRecentActivity = null;

      /**
       * Formats the userLog object to be presented to the view template.
       * @param userLog from the database.
       * @returns {{date: (*|string), description: string}}
       */
      this.format = function (userLog)
      {
        return {
          _id: userLog.id,
          _date: userLog.created_at,
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
       * Loads most recent user logs from the database and formats it for display; appends if repeatedly called
       * and loads older logs.
       * @param _options Options such as transaction or limit can be used here.
       * @returns {Promise} Returns the updated activities.
       */
      this.load = (_options) =>
      {
        const options = Object.assign({
          order: 'id DESC',
          include: [User]
        }, _options);

        // Load older logs if there are logs already loaded.
        if (this.activities.length > 0)
        {
          const oldestActivity = this.activities[this.activities.length - 1];
          Object.assign(options, {
            where: {
              id: {
                $lt: oldestActivity._id
              }
            }
          });
        }

        return UserLog.findAll(options).then(userLogs =>
        {
          if (userLogs.length === 0)
            return this.activities;

          olderActivities = [...olderActivities, ...userLogs.map(this.format)];
          if (mostRecentActivity === null)
            mostRecentActivity = olderActivities.shift();

          return this.activities =
            [mostRecentActivity, ...olderActivities];
        });
      };

      /**
       * Pull log updates from the database and prepends it to the logs.
       * @param _options Options such as transaction or limit can be used here.
       * @returns {Promise} Returns the updated activities.
       */
      this.pullUpdates = (_options) =>
      {
        const options = Object.assign({
          order: 'id DESC',
          include: [User]
        }, _options);

        // Load newer logs if there are logs already loaded.
        if (this.activities.length > 0)
          Object.assign(options, {
            where: {
              id: {
                $gt: mostRecentActivity._id
              }
            }
          });

        return UserLog.findAll(options).then(userLogs =>
        {
          // Second condition is meant to avoid race condition.
          if (userLogs.length === 0 || mostRecentActivity && userLogs[0].id === mostRecentActivity._id)
            return this.activities;

          olderActivities = [...userLogs.map(this.format), mostRecentActivity, ...olderActivities];
          mostRecentActivity = olderActivities.shift();

          return this.activities =
            [mostRecentActivity, ...olderActivities];
        });
      };

      /**
       * Initializations
       */

      /**
       * Preload the activities.
       */
      this.load({limit: DEFAULT_NUMBER_OF_ENTRIES}).then(activities => $scope.$apply());

      /**
       * Adds a listener for the notifier event if a user action is committed, the activity logs must be updated.
       * This also formats the activities.
       */
      this.onNotifyUserAction = new Promise(resolve => Notifier.addListener(userLog => this.pullUpdates({transaction: transaction}).then(resolve)));

      /**
       * Adds a refresh timer to pull log updates recurring from the database.
       */
      this.onNotifyTimer = new Promise(resolve => setInterval(() => this.pullUpdates({transaction: transaction}).then(resolve), REFRESH_RATE_IN_SECONDS * 1000));
    }]
  });