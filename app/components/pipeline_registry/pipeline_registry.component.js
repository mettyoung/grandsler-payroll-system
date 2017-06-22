angular.module('pipeline-registry')
  .component('pipelineRegistry', {
    bindings: {
      onDialogClosed: '&'
    },
    templateUrl: './components/pipeline_registry/pipeline_registry.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider', 'CustomValidator', 'CrudHandler',
      function ($scope, $mdDialog, Notifier, ModelProvider, CustomValidator, CrudHandler)
      {
        /**
         * This is used for the Notifier module.
         * @type {{created: {module: string, description: string}, deleted: {module: string, description: string, toast: string}, modified: {module: string, description: string}}}
         */
        const MESSAGE = {
          created: {
            module: 'Pipeline Registry',
            description: 'Created a pipeline successfully!'
          },
          deleted: {
            module: 'Pipeline Registry',
            description: 'Deleted a pipeline successfully!',
            toast: 'Deleted a pipeline!'
          },
          modified: {
            module: 'Pipeline Registry',
            description: 'Modified a pipeline successfully!'
          }
        };

        /**
         * Lifecycles
         */
        {
          CrudHandler.onBeforeSaveSelectedMasterItem(this, masterItem =>
          {
            if (masterItem.Operations.length === 0)
              return Promise.reject({
                name: 'Validation Error',
                message: 'Pipeline must have at least one operation.'
              });
            return Promise.resolve();
          });

          CrudHandler.onSaveSelectedMasterItem(this, transaction =>
          {
            let action = 'modified';
            let selectedPipeline = this.selectedPipeline;
            if (this.selectedPipeline.constructor === Object)
            {
              selectedPipeline = ModelProvider.models.Pipeline.build(selectedPipeline);
              action = 'created';
            }

            return Notifier.perform(() =>
              selectedPipeline.save({
                transaction: transaction
              }).then(pipeline =>
                {
                  // Save the details.
                  selectedPipeline = pipeline;

                  let promise = Promise.resolve();
                  // Delete to be deleted instances.
                  for (let instance of this.selectedPipeline.toBeDeleted)
                    if (instance.constructor !== Object)
                      promise = promise.then(() => ModelProvider.models.PipelineOperation.destroy({
                        where: {
                          pipeline_id: selectedPipeline.id,
                          operation_id: instance.id
                        },
                        transaction: transaction
                      }));

                  // Save all details.
                  for (let i = 0; i < this.selectedPipeline.Operations.length; i++)
                  {
                    const operation = this.selectedPipeline.Operations[i];
                    let instance;
                    if (operation.constructor === Object)
                      instance = ModelProvider.models.PipelineOperation.build({
                        pipeline_id: selectedPipeline.id,
                        operation_id: operation.id,
                        order: i
                      });
                    else
                    {
                      instance = operation.PipelineOperation;
                      instance.order = i;
                    }

                    promise = promise.then(() => instance.save({
                      transaction: transaction
                    }));
                  }
                  return promise;
                }
              ).catch(error =>
              {
                if (error.name === 'SequelizeUniqueConstraintError')
                  return Promise.reject({
                    name: 'Duplicate Error',
                    message: 'You cannot have duplicated operation in different stages.'
                  });
                if (error.name === 'SequelizeForeignKeyConstraintError')
                  return Promise.reject({
                    name: 'Reference Error',
                    message: 'Pipeline is in used.'
                  });
                return Promise.reject(error);
              }).then(() =>
              {
                this.commands.close();
                return MESSAGE[action];
              }), transaction);
          });

          CrudHandler.onDeleteSelectedMasterItem(this, transaction =>
          {
            if (this.selectedPipeline.constructor === Object)
              return Promise.reject('Cannot delete a new record.');

            return Notifier.perform(() =>
            {
              return ModelProvider.models.PipelineOperation.destroy({
                transaction: transaction,
                where: {
                  pipeline_id: this.selectedPipeline.id
                }
              }).then(() => this.selectedPipeline.destroy({transaction: transaction}))
                .catch(error =>
                {
                  if (error.name === 'SequelizeForeignKeyConstraintError')
                    return Promise.reject({
                      name: 'Reference Error',
                      message: 'Pipeline is in used.'
                    });
                  return Promise.reject(error);
                }).then(() =>
                {
                  this.commands.close();
                  return MESSAGE.deleted;
                });
            }, transaction);
          });

          CrudHandler.onPreload(this, transaction => ModelProvider.models.Operation.findAll({
            transaction: transaction
          }).then(operations => this.operations = operations));

          CrudHandler.onLoad(this, pageOptions =>
          {
            let options = {
              transaction: pageOptions.transaction
            };

            Object.assign(options, {
              include: [ModelProvider.models.Operation]
            });

            return ModelProvider.models.Pipeline.findAll(options).then(pipelines =>
            {
              return {
                data: pipelines
              };
            });
          });

          CrudHandler.onAfterSelectMasterItem(this, selectedItem => {
            selectedItem.toBeDeleted = [];
            selectedItem.Operations = selectedItem.Operations.sort((a, b) => (a.PipelineOperation.order - b.PipelineOperation.order) < 0? -1: 1);
          });
          CrudHandler.onAfterCreateMasterItem(this, selectedItem => selectedItem.toBeDeleted = []);
          CrudHandler.onAfterDeleteDetailItem(this, detailItem => this.selectedPipeline.toBeDeleted.push(detailItem));
        }

        /**
         * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
         */
        CrudHandler.bootstrap(this, $scope, {
          detailProperty: 'Operations',
          selectedMasterItemProperty: 'selectedPipeline',
          message: MESSAGE
        });

        /**
         * If environment is production or dev, then auto-load.
         */
        if (process.env.NODE_ENV !== 'test')
          this.commands.load();
        this.commands.createMasterItem();

        /**
         * Additional command for dialog.
         */
        /**
         * Hides the dialog.
         * @returns {Promise}
         */
        this.commands.close = () =>
        {
          return $mdDialog.hide().then(() => this.onDialogClosed());
        };

        /**
         * Opens operation registry.
         */
        this.commands.openOperationRegistry = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<operation-registry on-dialog-closed="$ctrl.parent.commands.preload()" layout="column"></operation-registry>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };
      }]
  });