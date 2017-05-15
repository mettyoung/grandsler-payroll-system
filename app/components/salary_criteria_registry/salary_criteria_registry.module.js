require('../../validations/validations.module');
require('../../services/notifier/notifier.module');
require('../../services/notifier/notifier.service');
require('../../services/model_provider/model_provider.module');
require('../../services/model_provider/model_provider.service');
angular.module('salary-criteria-registry', ['validations', 'notifier', 'model-provider']);