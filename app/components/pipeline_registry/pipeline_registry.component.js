angular.module('pipeline-registry')
  .component('pipelineRegistry', {
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
                  return ModelProvider.models.PipelineOperation.destroy({
                    transaction: transaction,
                    where: {
                      pipeline_id: selectedPipeline.id
                    }
                  });
                }
              ).then(() =>
              {
                let promise = Promise.resolve();
                for (let i = 0; i < this.selectedPipeline.Operations.length; i++)
                {
                  const operation = this.selectedPipeline.Operations[i];
                  promise = promise.then(() => ModelProvider.models.PipelineOperation.create({
                    pipeline_id: selectedPipeline.id,
                    operation_id: operation._id,
                    order: i
                  }, {
                    transaction: transaction
                  }));
                }
                return promise;
              }).catch(error =>
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
          }).then(operations => this.data.operations = operations));

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

          CrudHandler.onAfterSelectMasterItem(this, selectedItem =>
          {
            selectedItem.Operations = selectedItem.Operations.sort((a, b) => (a.PipelineOperation.order - b.PipelineOperation.order) < 0? -1: 1);
            for (let operation of selectedItem.Operations)
              operation._id = operation.id;
          });
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
          return $mdDialog.hide();
        };

        /**
         * Opens operation registry.
         */
        this.commands.openOperationRegistry = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<operation-registry layout="column"></operation-registry>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true,
            onRemoving: (event, removePromise) => removePromise.then(() => this.commands.preload())
          });
        };
      }]
  });