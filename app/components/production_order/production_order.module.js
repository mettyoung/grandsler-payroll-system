require('../../directives/front_end_validations.js');
require('../../services/notifier/notifier.module');
require('../../services/notifier/notifier.service');
require('../../services/crud_handler/crud_handler.module');
require('../../services/crud_handler/crud_handler.service');
require('../../services/model_provider/model_provider.module');
require('../../services/model_provider/model_provider.service');
require('../../components/stock_code_registry/stock_code_registry.module');
require('../../components/stock_code_registry/stock_code_registry.component');
require('../../components/stock_code_registry/stock_code_registry.config');
require('../../components/color_registry/color_registry.module');
require('../../components/color_registry/color_registry.component');
require('../../components/color_registry/color_registry.config');
require('../../components/size_registry/size_registry.module');
require('../../components/size_registry/size_registry.component');
require('../../components/size_registry/size_registry.config');
angular.module('production-order', ['md.data.table', 'front-end-validations', 'notifier',
  'crud-handler', 'model-provider', 'stock-code-registry', 'color-registry', 'size-registry']);