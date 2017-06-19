require('../../directives/front_end_validations.js');
require('../../services/notifier/notifier.module');
require('../../services/notifier/notifier.service');
require('../../services/crud_handler/crud_handler.module');
require('../../services/crud_handler/crud_handler.service');
require('../../services/model_provider/model_provider.module');
require('../../services/model_provider/model_provider.service');
require('../../components/production_order_dialog/production_order_dialog.module');
require('../../components/production_order_dialog/production_order_dialog.component');
require('../../components/production_order_dialog/production_order_dialog.config');
angular.module('production-order', ['md.data.table', 'front-end-validations',
  'notifier', 'crud-handler', 'model-provider', 'production-order-dialog', 'cfp.hotkeys']);