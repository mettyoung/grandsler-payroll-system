require('../../directives/front_end_validations.js');
require('../../services/notifier/notifier.module');
require('../../services/notifier/notifier.service');
require('../../services/model_provider/model_provider.module');
require('../../services/model_provider/model_provider.service');
require('../../services/crud_handler/crud_handler.module');
require('../../services/crud_handler/crud_handler.service');
angular.module('color-registry', ['front-end-validations', 'notifier', 'model-provider', 'crud-handler']);