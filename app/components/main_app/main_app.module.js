require('../action_bar/action_bar.module');
require('../action_bar/action_bar.component');
require('../action_bar/action_bar.config');
require('../navigation_bar/navigation_bar.module');
require('../navigation_bar/navigation_bar.component');
require('../navigation_bar/navigation_bar.config');
require('../activity_logs/activity_logs.module');
require('../activity_logs/activity_logs.component');
require('../employee_management/employee_management.module');
require('../employee_management/employee_management.component');
require('../employee_management/employee_management.config');

angular.module('main-app', [
  'ui.router',
  'action-bar',
  'navigation-bar',
  'activity-logs',
  'employee-management'
]);