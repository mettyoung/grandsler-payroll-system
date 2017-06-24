require('../change_password/change_password.module');
require('../change_password/change_password.component');
require('../salary_criteria_registry/salary_criteria_registry.module');
require('../salary_criteria_registry/salary_criteria_registry.component');
require('../settings/settings.module');
require('../settings/settings.component');
require('../../services/model_provider/model_provider.module');
require('../../services/model_provider/model_provider.service');
angular.module('action-bar', ['change-password', 'salary-criteria-registry', 'settings', 'model-provider']);