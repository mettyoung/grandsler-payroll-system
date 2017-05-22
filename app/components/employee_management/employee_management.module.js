require('../../services/crud_handler/crud_handler.module');
require('../../services/crud_handler/crud_handler.service');
require('../../services/model_provider/model_provider.module');
require('../../services/model_provider/model_provider.service');
angular.module('employee-management', ['crud-handler', 'model-provider', 'md.data.table']);