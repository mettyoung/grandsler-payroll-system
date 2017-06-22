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
                include: [ModelProvider.models.StockCode, ModelProvider.models.Color, ModelProvider.models.Size]
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
              group: ['ChildrenProductionLines.parent_id'],
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
           * Construct the detail view model.
           */
          CrudHandler.onAfterSelectMasterItem(this, () =>
          {
            // Compute quantity remaining on reload.
            this.commands.computeQuantityRemaining();
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

          CrudHandler.onSaveSelectedMasterItem(this, transaction =>
          {
            return Notifier.perform(() =>
              this.selected_item.save({
                transaction: transaction
              }).then(productionOrder =>
              {
                let promise = ModelProvider.sequelize.query('DELETE FROM production_lines WHERE production_id = ? ORDER BY id DESC', {
                  replacements: [productionOrder.id],
                  type: ModelProvider.sequelize.QueryTypes.DELETE,
                  transaction: transaction
                });

                for (let operation of this.selected_item.detail)
                  for (let line of operation.lines)
                    for (let productionLine of line.production_lines)
                    {
                      promise = promise.then(() =>
                      {
                        let newProductionLine = productionLine;
                        if (productionLine.constructor !== Object)
                          newProductionLine = productionLine.get({plain: true});
                        newProductionLine.employee_id = productionLine.Employee.id;

                        newProductionLine = Object.assign({
                          parent_id: null,
                          production_id: productionOrder.id,
                          stock_code_id: productionOrder.StockCode.id,
                          pipeline_id: productionOrder.StockCode.pipeline_id,
                          operation_id: operation.id
                        }, newProductionLine);

                        newProductionLine = ModelProvider.models.ProductionLine.build(newProductionLine);

                        return newProductionLine.save({transaction: transaction})
                          .then(parentProductionLine =>
                          {
                            if (productionLine.childLine)
                              for (let childProductionLine of productionLine.childLine.production_lines)
                                childProductionLine.parent_id = parentProductionLine.id;
                          })
                      });
                    }
                return promise;
              }).then(() => MESSAGE.modified), transaction);
          });

          CrudHandler.onDeleteSelectedMasterItem(this, transaction =>
          {
            if (this.selected_item.constructor === Object)
              return Promise.reject('Cannot delete a new record.');

            return Notifier.perform(() =>
            {
              return ModelProvider.sequelize.query('DELETE FROM production_lines WHERE production_id = ? ORDER BY id DESC', {
                replacements: [this.selected_item.id],
                type: ModelProvider.sequelize.QueryTypes.DELETE,
                transaction: transaction
              }).then(() => this.selected_item.destroy({transaction: transaction}))
                .catch(error =>
                {
                  if (error.name === 'SequelizeForeignKeyConstraintError')
                    return Promise.reject({
                      name: 'Reference Error',
                      message: 'Production Order is in used.'
                    });
                  return Promise.reject(error);
                }).then(() => MESSAGE.deleted);
            }, transaction);
          });
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
          for (let i = 0; i < 5; i++)
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