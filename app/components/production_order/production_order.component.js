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
              }),
              ModelProvider.models.Meta.findOne({
                transaction: transaction,
                where: {
                  particular: 'tolerable_threshold'
                }
              })
            ]).then(values =>
            {
              [this.data.stock_codes, this.data.colors, this.data.sizes] = values;
              const numberOfOperations = values[3] && values[3].get('total_count') || 0;
              this.data.operation_numbers = [...new Array(numberOfOperations).keys()].map(value => value + 1);
              // Remove operation 1 from filter.
              this.data.operation_numbers.shift();
              // Load the tolerable_threshold.
              this.data.tolerable_threshold = Number(values[4].value);
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

            // Add filters
            const selections = ['PL.operation_number < numberOfOperations'];
            let postSelection = '';

            if (this.query.employee_name && this.query.employee_name.length > 0)
              selections.push(`(
                E.first_name LIKE '%${this.query.employee_name}%' OR 
                E.middle_name LIKE '%${this.query.employee_name}%' OR 
                E.last_name LIKE '%${this.query.employee_name}%' OR 
                CPLE.first_name LIKE '%${this.query.employee_name}%' OR 
                CPLE.middle_name LIKE '%${this.query.employee_name}%' OR 
                CPLE.last_name LIKE '%${this.query.employee_name}%')`);

            if (this.query.operation_number !== 0)
              selections.push(`PL.operation_number = ${this.query.operation_number - 1}`);

            if (this.query.stock_code_id !== 0)
              selections.push(`P.stock_code_id = ${this.query.stock_code_id}`);

            if (this.query.color_id !== 0)
              selections.push(`P.color_id = ${this.query.color_id}`);

            if (this.query.size_id !== 0)
              selections.push(`P.size_id = ${this.query.size_id}`);

            if (this.query.is_finished !== 0)
              selections.push(`P.is_finished = ${this.query.is_finished}`);

            if (this.query.progress)
              postSelection = `HAVING progress >= ${this.query.progress}`;

            const limitPredicate = ` LIMIT ${pageOptions.offset}, ${pageOptions.limit}`;
            const query = `
              SELECT 
                PL.id,
               (SUM(CPL.dozen_quantity * 12 + CPL.piece_quantity) / (PL.dozen_quantity * 12 + PL.piece_quantity)) * 100 AS 'progress'
              FROM
                production_lines PL
              LEFT JOIN production_lines CPL 
                ON CPL.parent_id = PL.id
              LEFT JOIN productions P
                ON P.id = PL.production_id
              LEFT JOIN 
                  (SELECT 
                      stock_codes.id, COUNT(stock_codes_operations.operation_id) AS 'numberOfOperations'
                  FROM
                      stock_codes
                  LEFT JOIN stock_codes_operations ON stock_codes_operations.stock_code_id = stock_codes.id
                  GROUP BY stock_codes.id) SummaryStockCode 
                ON SummaryStockCode.id = P.stock_code_id
              LEFT JOIN employees E
                ON E.id = PL.employee_id
              LEFT JOIN employees CPLE 
                ON CPLE.id = CPL.employee_id
              WHERE 
                 ${selections.join(' AND ')}
              GROUP BY 
                PL.id
              ${postSelection}`;

            const countQuery = `SELECT COUNT(id) AS 'count' FROM (${query}) A`;

            this.data.show_progress_bar = true;
            // Execute the query.
            return Promise.all([
              ModelProvider.sequelize.query(query + limitPredicate, {type: ModelProvider.sequelize.QueryTypes.SELECT}),
              ModelProvider.sequelize.query(countQuery, {type: ModelProvider.sequelize.QueryTypes.SELECT})
            ]).then(values =>
            {
              const production_line_ids = values[0].map(row => row.id);

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
                  total_count: values[1][0].count
                };
              });
            });
          });

          /**
           * Validation logic before saving.
           */
          CrudHandler.onBeforeSaveSelectedMasterItem(this, masterItem =>
          {
            if (masterItem.getProgress() - 100 > this.data.tolerable_threshold)
              return Promise.reject({
                name: 'Validation Error',
                message: `The total quantity out must only have ${this.data.tolerable_threshold}% error tolerance.`
              });
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
                    let instance = childLine;
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
              ).catch(error =>
              {
                if (error.name === 'SequelizeForeignKeyConstraintError')
                  return Promise.reject({
                    name: 'Reference Error',
                    message: 'You cannot delete a used production line in the succeeding operations.'
                  });
                return Promise.reject(error);
              }).then(() => MESSAGE.modified), transaction);
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
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true,
            onRemoving: (event, removePromise) => removePromise.then(() => this.commands.preload() && this.commands.load())
          });
        };

        /**
         * Edits the first operation's production order line.
         * @param productionOrderLine
         */
        this.commands.editProductionOrder = productionOrderLine =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<production-order-dialog production-order-line="$ctrl.productionOrderLine" layout="column"></production-order-dialog>' +
            '</md-dialog>',
            multiple: true,
            locals: {productionOrderLine},
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
              .then(() => {
                this._isWriteIdle = true;
                if (!this.write_error)
                  this.selected_item = null;
                return this.commands.load();
              });
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