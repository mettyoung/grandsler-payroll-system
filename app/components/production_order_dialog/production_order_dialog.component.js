angular.module('production-order-dialog')
  .component('productionOrderDialog', {
    bindings: {
      onDialogClosed: '&',
      layout: '@',
      flex: '@'
    },
    templateUrl: './components/production_order_dialog/production_order_dialog.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'CrudHandler', 'ModelProvider',
      function ($scope, $mdDialog, Notifier, CrudHandler, ModelProvider)
      {
        /**
         * This is used for the Notifier module.
         */
        const MESSAGE = {
          module: 'Production Order',
          description: 'Created a production order successfully!'
        };

        /**
         * Life cycles
         */
        {
          CrudHandler.onSaveSelectedMasterItem(this, transaction =>
          {
            let selectedItem = this.selected_item;
            selectedItem.stock_code_id = selectedItem.StockCode.id;
            selectedItem.color_id = selectedItem.Color.id;
            selectedItem.size_id = selectedItem.Size.id;
            selectedItem.employee_id = selectedItem.Employee.id;
            selectedItem = ModelProvider.models.Production.build(selectedItem);

            return Notifier.perform(() =>
              selectedItem.save({
                transaction: transaction
              }).then(() =>
              {
                this.commands.close();
                return MESSAGE;
              }), transaction);
          });
        }

        /**
         * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
         */
        CrudHandler.bootstrap(this, $scope);

        /**
         * If environment is production or dev, then auto-load.
         */
        if (process.env.NODE_ENV !== 'test')
          this.commands.load();

        /**
         * Hides the dialog.
         * @returns {Promise}
         */
        this.commands.close = () =>
        {
          return $mdDialog.hide().then(() => this.onDialogClosed());
        };

        /**
         * Opens stock code registry.
         */
        this.commands.openStockCodeRegistry = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<stock-code-registry on-dialog-closed="$ctrl.parent.commands.preload()" layout="column"></stock-code-registry>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

        /**
         * Opens color registry.
         */
        this.commands.openColorRegistry = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<color-registry on-dialog-closed="$ctrl.parent.commands.preload()" layout="column"></color-registry>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

        /**
         * Opens size registry.
         */
        this.commands.openSizeRegistry = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<size-registry on-dialog-closed="$ctrl.parent.commands.preload()" layout="column"></size-registry>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

        /**
         * Autocomplete queries.
         */
        this.commands.autocomplete = {
          queryStockCode: query =>
          {
            query = query || '';
            return ModelProvider.models.StockCode.findAll({
              where: {
                name: {
                  $like: '%' + query + '%'
                }
              }
            });
          },
          queryColor: query =>
          {
            query = query || '';
            return ModelProvider.models.Color.findAll({
              where: {
                name: {
                  $like: '%' + query + '%'
                }
              }
            });
          },
          querySize: query =>
          {
            query = query || '';
            return ModelProvider.models.Size.findAll({
              where: {
                name: {
                  $like: '%' + query + '%'
                }
              }
            });
          },
          queryEmployee: query =>
          {
            query = query || '';
            return ModelProvider.models.Employee.findAll({
              where: {
                $or: {
                  first_name: {
                    $like: '%' + query + '%'
                  },
                  middle_name: {
                    $like: '%' + query + '%'
                  },
                  last_name: {
                    $like: '%' + query + '%'
                  }
                },
                employee_type: 'Output-based'
              }
            });
          }
        };
      }]
  });