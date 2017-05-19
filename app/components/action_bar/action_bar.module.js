require('../change_password/change_password.module');
require('../change_password/change_password.component');
require('../salary_criteria_registry/salary_criteria_registry.module');
require('../salary_criteria_registry/salary_criteria_registry.component');
require('../time_shift_registry/time_shift_registry.module');
require('../time_shift_registry/time_shift_registry.component');
require('../time_shift_registry/time_shift_registry.config');
angular.module('action-bar', ['change-password', 'salary-criteria-registry', 'time-shift-registry']);