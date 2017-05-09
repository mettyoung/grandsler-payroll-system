const moment = require('moment');
const capitalize = require('lodash.capitalize');

angular.module('activity-logs')
  .component('activityLogs', {
    templateUrl: './components/activity_logs/activity_logs.template.html',
    controller: ['Notifier', function (Notifier)
    {
      Notifier.addListener(message => {
        this.messages.push({
          date: moment(message.created_at).format("MMMM Do YYYY, hh:mm:ss a"),
          description: `${capitalize(message.username)} ${message.description.toLowerCase()}`
        })
      });

      this.messages = [];
    }]
  });