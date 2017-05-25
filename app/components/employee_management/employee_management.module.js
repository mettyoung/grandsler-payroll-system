require('../../directives/front_end_validations.js');
require('../../services/notifier/notifier.module');
require('../../services/notifier/notifier.service');
require('../../services/crud_handler/crud_handler.module');
require('../../services/crud_handler/crud_handler.service');
require('../../services/model_provider/model_provider.module');
require('../../services/model_provider/model_provider.service');
require('../../components/position_registry/position_registry.module');
require('../../components/position_registry/position_registry.component');
require('../../components/employee_memos/employee_memos.module');
require('../../components/employee_memos/employee_memos.component');
require('../../components/employment_history/employment_history.module');
require('../../components/employment_history/employment_history.component');
angular.module('employee-management', ['front-end-validations', 'notifier', 'crud-handler', 
  'model-provider', 'md.data.table', 'position-registry', 'employee-memos', 'employment-history']);