require('../../directives/front_end_validations.js');
require('../../services/notifier/notifier.module');
require('../../services/notifier/notifier.service');
require('../../services/model_provider/model_provider.module');
require('../../services/model_provider/model_provider.service');
require('../../services/custom_validator/custom_validator.module');
require('../../services/custom_validator/custom_validator.service');
require('../../services/crud_handler/crud_handler.module');
require('../../services/crud_handler/crud_handler.service');
require('../pipeline_registry/pipeline_registry.module');
require('../pipeline_registry/pipeline_registry.component');
require('../pipeline_registry/pipeline_registry.config');
angular.module('stock-code-registry', ['front-end-validations', 'notifier', 'model-provider', 'custom-validator', 'crud-handler', 'pipeline-registry']);