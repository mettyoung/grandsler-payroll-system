require('../action_bar/action_bar.module');
require('../action_bar/action_bar.component');
require('../navigation_bar/navigation_bar.module');
require('../navigation_bar/navigation_bar.component');
require('../navigation_bar/navigation_bar.config');
require('../activity_logs/activity_logs.module');
require('../activity_logs/activity_logs.component');

angular.module('main-app', ['action-bar', 'navigation-bar', 'activity-logs']);