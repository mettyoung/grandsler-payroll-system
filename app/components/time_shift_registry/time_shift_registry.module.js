require('../../directives/front_end_validations.js');
require('../../services/notifier/notifier.module');
require('../../services/notifier/notifier.service');
require('../../services/model_provider/model_provider.module');
require('../../services/model_provider/model_provider.service');
require('../../services/custom_validator/custom_validator.module');
require('../../services/custom_validator/custom_validator.service');
require('../../services/crud_helper/crud_helper.module');
require('../../services/crud_helper/crud_helper.service');
angular.module('time-shift-registry', ['front-end-validations', 'notifier', 'model-provider', 'custom-validator', 'crud-helper']);