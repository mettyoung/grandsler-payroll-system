angular.module('production-order')
  .component('productionOrder', {
    bindings: {
      layout: '@',
      flex: '@'
    },
    templateUrl: './components/production_order/production_order.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'CrudHandler', 'ModelProvider', 'hotkeys',
      function ($scope, $mdDialog, Notifier, CrudHandler, ModelProvider, hotkeys)
      {
        /**
         * This is used for the Notifier module.
         * @type {{deleted: {module: string, description: string, toast: string}, modified: {module: string, description: string}}}
         */
        const MESSAGE = {
          deleted: {
            module: 'Production Order',
            description: 'Deleted a production order successfully!',
            toast: 'Deleted a production order!'
          },
          modified: {
            module: 'Production Order',
            description: 'Modified a production order successfully!'
          }
        };

        /**
         * Life cycles
         */
        {
          CrudHandler.onPreload(this, transaction => Promise.all([
              ModelProvider.models.StockCode.findAll({
                transaction: transaction
              }),
              ModelProvider.models.Color.findAll({
                transaction: transaction
              }),
              ModelProvider.models.Size.findAll({
                transaction: transaction
              }),
              ModelProvider.models.PipelineOperation.findOne({
                transaction: transaction,
                group: ['pipeline_id'],
                attributes: [[ModelProvider.sequelize.fn('COUNT', ModelProvider.sequelize.col('*')), 'total_count']],
                order: [[ModelProvider.sequelize.col('total_count'), 'DESC']]
              })
            ]).then(values =>
            {
              [this.data.stock_codes, this.data.colors, this.data.sizes] = values;
              const numberOfOperations = values[3] && values[3].get('total_count') || 0;
              this.data.operation_numbers = [...new Array(numberOfOperations).keys()].map(value => value + 1);
            })
          );

          CrudHandler.onLoad(this, pageOptions =>
          {
            /**
             * We have to separate two queries since it is impossible to eager load hasMany associations while
             * creating a selection based on other joined tables and paginating.
             */
            const associations = [
              {
                model: ModelProvider.models.Production,
                include: [ModelProvider.models.Color, ModelProvider.models.Size,
                  {
                    model: ModelProvider.models.StockCode,
                    include: [ModelProvider.models.Operation]
                  }]
              },
              {
                model: ModelProvider.models.ProductionLine,
                as: "ChildrenProductionLines",
                include: [ModelProvider.models.Employee]
              },
              ModelProvider.models.Employee
            ];

            // Create selection options with associations.
            const selectionOptions = {
              include: associations,
              where: {},
              group: ['ProductionLine.id'],
              order: ['id'],
              subQuery: false
            };

            // Add filters
            if (this.query.employee_name && this.query.employee_name.length > 0)
              Object.assign(selectionOptions.where, {
                $or: [
                  ModelProvider.Sequelize.literal(`\`Employee\`.first_name LIKE '%${this.query.employee_name}%'`),
                  ModelProvider.Sequelize.literal(`\`Employee\`.middle_name LIKE '%${this.query.employee_name}%'`),
                  ModelProvider.Sequelize.literal(`\`Employee\`.last_name LIKE '%${this.query.employee_name}%'`),
                  ModelProvider.Sequelize.literal(`\`ChildrenProductionLines.Employee\`.first_name LIKE '%${this.query.employee_name}%'`),
                  ModelProvider.Sequelize.literal(`\`ChildrenProductionLines.Employee\`.middle_name LIKE '%${this.query.employee_name}%'`),
                  ModelProvider.Sequelize.literal(`\`ChildrenProductionLines.Employee\`.last_name LIKE '%${this.query.employee_name}%'`)
                ]
              });

            if (this.query.stock_code_id !== 0)
              Object.assign(selectionOptions.where, {
                $and: [ModelProvider.Sequelize.literal(`\`Production\`.stock_code_id = ${this.query.stock_code_id}`)]
              });

            if (this.query.color_id !== 0)
              Object.assign(selectionOptions.where, {
                $and: [ModelProvider.Sequelize.literal(`\`Production\`.color_id = ${this.query.color_id}`)]
              });

            if (this.query.size_id !== 0)
              Object.assign(selectionOptions.where, {
                $and: [ModelProvider.Sequelize.literal(`\`Production\`.size_id = ${this.query.size_id}`)]
              });

            if (this.query.is_finished !== 0)
              Object.assign(selectionOptions.where, {
                $and: [ModelProvider.Sequelize.literal(`\`Production\`.is_finished = ${this.query.is_finished}`)]
              });

            this.data.show_progress_bar = true;

            // Execute the query.
            return ModelProvider.models.ProductionLine.findAndCountAll(Object.assign(pageOptions, selectionOptions))
              .then(result =>
              {
                const production_line_ids = result.rows.map(row => row.id);

                return ModelProvider.models.ProductionLine.findAll({
                  include: associations,
                  where: {
                    id: production_line_ids
                  }
                }).then(productionLines =>
                {
                  this.data.show_progress_bar = false;
                  return {
                    data: productionLines,
                    total_count: result.count.length
                  };
                });
              });
          });

          /**
           * Validation logic before saving.
           */
          CrudHandler.onBeforeSaveSelectedMasterItem(this, masterItem =>
          {
            let operationCounter = 1;
            for (let operation of masterItem.detail)
            {
              if (operation.dozen_quantity_remaining * operation.piece_quantity_remaining < 0)
                return Promise.reject({
                  name: 'Validation Error',
                  message: `Quantity remaining of Operation ${operationCounter}: "${operation.name}" must not be negative.`
                });
              operationCounter++;
            }

            return Promise.resolve();
          });

          /**
           * Save logic.
           */
          CrudHandler.onSaveSelectedMasterItem(this, transaction =>
          {
            return Notifier.perform(() =>
              this.selected_item.save({
                transaction: transaction
              }).then(productionOrderLine =>
                {
                  let promise = Promise.resolve();
                  // Delete to be deleted instances.
                  for (let instance of this.selected_item.toBeDeleted)
                    if (instance.constructor !== Object)
                      promise = promise.then(() => instance.destroy({
                        transaction: transaction
                      }));

                  // Save all details.
                  for (let childLine of this.selected_item.ChildrenProductionLines)
                  {
                    let instance;
                    if (childLine.constructor === Object)
                      instance = ModelProvider.models.ProductionLine.build(Object.assign({
                        parent_id: productionOrderLine.id,
                        production_id: this.selected_item.Production.id,
                        stock_code_id: this.selected_item.Production.stock_code_id,
                        pipeline_id: this.selected_item.Production.StockCode.pipeline_id,
                        operation_id: this.selected_item.Production.StockCode.Operations[this.selected_item.operation_number].id,
                        operation_number: this.selected_item.operation_number + 1
                      }, childLine));

                    instance.employee_id = childLine.Employee.id;

                    promise = promise.then(() => instance.save({
                      transaction: transaction
                    }));
                  }
                  return promise;
                }
              ).then(() => MESSAGE.modified), transaction);
          });

          CrudHandler.onAfterSelectMasterItem(this, selectedItem =>
          {
            selectedItem.toBeDeleted = [];
            this.commands.computeQuantityRemaining();
            selectedItem.Production.StockCode.Operations =
              selectedItem.Production.StockCode.Operations.sort((a, b) => (a.StockCodeOperation.order - b.StockCodeOperation.order) < 0 ? -1 : 1);
          });
          CrudHandler.onAfterDeleteDetailItem(this, detailItem => this.selected_item.toBeDeleted.push(detailItem) && this.commands.computeQuantityRemaining());
        }

        /**
         * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
         */
        const options = {
          detailProperty: 'ChildrenProductionLines'
        };

        CrudHandler.bootstrap(this, $scope, options).then(() =>
        {
          /**
           * If environment is production or dev, then auto-load.
           */
          if (process.env.NODE_ENV !== 'test')
            this.commands.load();
        });

        /**
         * Initialize selected_item to null.
         */
        this.selected_item = null;

        /**
         * Override createMasterItem.
         */
        this.commands.createMasterItem = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<production-order-dialog layout="column"></production-order-dialog>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true,
            onRemoving: (event, removePromise) => removePromise.then(() => this.commands.preload() && this.commands.load())
          });
        };

        /**
         * Mark finished the production order.
         * @param productionOrder
         * @returns {*}
         */
        this.commands.markFinished = productionOrder =>
        {
          const message = `You won't be able modify all production order lines that belongs to the batch ${productionOrder.id} anymore. Are you sure you want to proceed?`;

          if (this._isWriteIdle)
          {
            this._isWriteIdle = false;
            return CrudHandler._confirmation(message).then(() =>
            {
              productionOrder.is_finished = true;
              return productionOrder.save()
                .catch(error => this.write_error = error)
                .then(() => $scope.$apply())
            }, () => (0))
              .then(() => this._isWriteIdle = true);
          }
        };

        /**
         * Autocomplete queries.
         */
        this.commands.autocomplete = {
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

        /**
         * Computes and updates quantity remaining of all operations of the selected_item.
         */
        this.commands.computeQuantityRemaining = () =>
        {
          const totalQuantityIn = this.selected_item.dozen_quantity * 12 + this.selected_item.piece_quantity;
          const totalQuantityOut = this.selected_item.ChildrenProductionLines.reduce(
            (accumulator, production_line) => accumulator + production_line.dozen_quantity * 12 + production_line.piece_quantity, 0);
          const totalQuantityRemaining = totalQuantityIn - totalQuantityOut;

          if (!isNaN(totalQuantityRemaining))
          {
            this.selected_item.dozen_quantity_remaining = Math.floor(totalQuantityRemaining / 12);
            this.selected_item.piece_quantity_remaining = Math.abs(totalQuantityRemaining % 12);
            this.selected_item.progress = totalQuantityOut / totalQuantityIn * 100;
          }
        };

        /**
         * Add hotkeys
         */
        const hotkeysDictionary = hotkeys.bindTo($scope)
          .add({
            combo: 'ctrl+c',
            description: 'Creates a new production order.',
            callback: (event, hotkey) =>
            {
              this.commands.createMasterItem();
            }
          });

        const addSelectionHotkeys = hotkeysDictionary =>
        {
          for (let i = 0; i < 10; i++)
            hotkeysDictionary = hotkeysDictionary.add({
              combo: `f${i + 1}`,
              description: `Selects production order #${i + 1}`,
              callback: (event, hotkey) =>
              {
                if (this.data.selected && this.data.selected.length > i)
                  this.commands.selectMasterItem(this.data.selected[i]);
              }
            });

          return hotkeysDictionary;
        };

        addSelectionHotkeys(hotkeysDictionary);
      }]
  });