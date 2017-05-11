require('../../services/notifier/notifier.module');
require('../../services/notifier/notifier.service');
require('../../services/progress/progress.module');
require('../../services/progress/progress.service');
angular.module('activity-logs', ['ngMaterial', 'notifier', 'progress']);