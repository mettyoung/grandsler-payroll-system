angular.module('time-shift-registry')
  .component('timeShiftRegistry', {
    templateUrl: './components/time_shift_registry/time_shift_registry.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider', 'CustomValidator', 'CrudHandler',
      function ($scope, $mdDialog, Notifier, ModelProvider, CustomValidator, CrudHandler)
      {
        /**
         * This is used for the Notifier module.
         * @type {{created: {module: string, description: string}, deleted: {module: string, description: string, toast: string}, modified: {module: string, description: string}}}
         */
        const MESSAGE = {
          created: {
            module: 'Time Shift Registry',
            description: 'Created a time-shift successfully!'
          },
          deleted: {
            module: 'Time Shift Registry',
            description: 'Deleted a time-shift successfully!',
            toast: 'Deleted a time-shift!'
          },
          modified: {
            module: 'Time Shift Registry',
            description: 'Modified a time-shift successfully!'
          }
        };
        
        /**
         * Lifecycles
         */
        {
          /**
           * Validation logic before saving.
           */
          CrudHandler.onBeforeSaveSelectedMasterItem(this, timeShift =>
          {
            const timeFrames = [];
            for (let timeFrame of timeShift.TimeFrames)
            {
              timeFrames.push({
                startTime: timeFrame.flex_in_from,
                endTime: timeFrame.flex_in_to
              });
              timeFrames.push({
                startTime: timeFrame.flex_out_from,
                endTime: timeFrame.flex_out_to
              });
            }

            if (CustomValidator.IsTimeRangeOverlapping(timeFrames))
              return Promise.reject({
                name: 'Validation Error',
                message: 'Time frames must not be overlapping.'
              });

            return Promise.resolve();
          });

          CrudHandler.onSaveSelectedMasterItem(this, transaction =>
          {
            let action = 'modified';
            if (this.selectedTimeShift.constructor === Object)
            {
              this.selectedTimeShift = ModelProvider.models.TimeShift.build(this.selectedTimeShift, {
                include: [ModelProvider.models.TimeFrame]
              });
              action = 'created';
            }

            return Notifier.perform(() =>
              this.selectedTimeShift.save({
                transaction: transaction,
                include: [ModelProvider.models.TimeFrame]
              }).then(() =>
              {
                this.close();
                return MESSAGE[action];
              }), transaction);
          });
          
          CrudHandler.onDeleteSelectedMasterItem(this, transaction =>
          {
            if (this.selectedTimeShift.constructor === Object)
              return Promise.reject('Cannot delete a new record.');

            return Notifier.perform(() =>
            {
              let promise = Promise.resolve();
              for (let timeFrame of this.selectedTimeShift.TimeFrames)
                promise = promise.then(() => timeFrame.destroy({transaction: transaction}));

              promise = promise.then(() =>
                this.selectedTimeShift.destroy({
                  transaction: transaction
                }));

              return promise.then(() =>
              {
                this.close();
                return MESSAGE.deleted;
              });
            }, transaction);
          });

          CrudHandler.onPreload(this, transaction => ModelProvider.models.SALARY_CRITERION.findAll({
              transaction: transaction,
              where: {
                name: ['Regular', 'Night-differential']
              },
              order: [['name', 'DESC']]
            })
              .then(salary_criteria => this.SALARY_CRITERIA = salary_criteria));
          
          CrudHandler.onLoad(this, pageOptions =>
          {
            let options = {
              transaction: pageOptions.transaction
            };

            Object.assign(options, {
              include: [ModelProvider.models.TimeFrame]
            });
            
            return ModelProvider.models.TimeShift.findAll(options).then(timeShifts => {
              return {
                data: timeShifts
              };
            });
          });
        }
        
        /**
         * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
         */
        CrudHandler.bootstrap(this, $scope, {
          detailProperty: 'TimeFrames',
          selectedMasterItemProperty: 'selectedTimeShift',
          message: MESSAGE
        });

        /**
         * If environment is production or dev, then auto-load.
         */
        if (process.env.NODE_ENV !== 'test')
          this.commands.load();

        /**
         * Additional command for dialog.
         */
        /**
         * Hides the dialog.
         * @returns {Promise}
         */
        this.close = function ()
        {
          return $mdDialog.hide();
        };
      }]
  });