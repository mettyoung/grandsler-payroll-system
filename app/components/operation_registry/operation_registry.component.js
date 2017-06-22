angular.module('operation-registry')
  .component('operationRegistry', {
    templateUrl: './components/operation_registry/operation_registry.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider', 'CrudHandler',
      function ($scope, $mdDialog, Notifier, ModelProvider, CrudHandler)
      {
        /**
         * This is used for the Notifier module.
         * @type {{created: {module: string, description: string}, deleted: {module: string, description: string, toast: string}, modified: {module: string, description: string}}}
         */
        const MESSAGE = {
          created: {
            module: 'Operation Registry',
            description: 'Created a operation successfully!'
          },
          deleted: {
            module: 'Operation Registry',
            description: 'Deleted a operation successfully!',
            toast: 'Deleted a operation!'
          },
          modified: {
            module: 'Operation Registry',
            description: 'Modified a operation successfully!'
          }
        };
        
        /**
         * Lifecycles
         */
        {
          CrudHandler.onSaveSelectedMasterItem(this, transaction =>
          {
            let action = 'modified';
            if (this.selected_item.constructor === Object)
            {
              this.selected_item = ModelProvider.models.Operation.build(this.selected_item);
              action = 'created';
            }

            return Notifier.perform(() =>
              this.selected_item.save({
                transaction: transaction
              }).then(() =>
              {
                this.commands.close();
                return MESSAGE[action];
              }), transaction);
          });
          
          CrudHandler.onDeleteSelectedMasterItem(this, transaction =>
          {
            if (this.selected_item.constructor === Object)
              return Promise.reject('Cannot delete a new record.');

            return Notifier.perform(() =>
            {
              return this.selected_item.destroy({
                transaction: transaction
              }).catch(error => {
                if (error.name === 'SequelizeForeignKeyConstraintError')
                  return Promise.reject({
                    name: 'Reference Error',
                    message: 'Operation is in used.'
                  });
                return Promise.reject(error);
              }).then(() =>
              {
                this.commands.close();
                return MESSAGE.deleted;
              });
            }, transaction);
          });

          CrudHandler.onLoad(this, pageOptions =>
          {
            let options = {
              transaction: pageOptions.transaction
            };
            
            return ModelProvider.models.Operation.findAll(options).then(operations => {
              return {
                data: operations
              };
            });
          });
        }
        
        /**
         * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
         */
        CrudHandler.bootstrap(this, $scope, {
          message: MESSAGE
        });

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
          return $mdDialog.hide();
        };
      }]
  });