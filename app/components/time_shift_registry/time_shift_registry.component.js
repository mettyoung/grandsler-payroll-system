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
          CrudHandler.onAfterCreateMasterItem(() =>
          {
            // Set it to untouched to reset validations.
            this.Form.$setUntouched();
          });

          /**
           * Validation logic before saving.
           */
          CrudHandler.onBeforeSaveSelectedMasterItem(timeShift =>
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

          CrudHandler.onSaveSelectedMasterItem(transaction =>
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
          
          CrudHandler.onDeleteSelectedMasterItem(transaction =>
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

          CrudHandler.onLoad(transaction =>
          {
            return Promise.all([
              ModelProvider.models.TimeShift.findAll({
                include: [ModelProvider.models.TimeFrame],
                transaction: transaction
              }),
              ModelProvider.models.SALARY_CRITERION.findAll({
                transaction: transaction,
                where: {
                  name: ['Regular', 'Night-differential']
                },
                order: [['name', 'DESC']]
              })
            ]).then(values =>
            {
              this.timeShifts = values[0];
              this.SALARY_CRITERIA = values[1];

              return this.timeShifts;
            })
          });
        }
        
        /**
         * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
         */
        CrudHandler.bootstrap(this, $scope, {
          masterProperty: 'timeShifts',
          detailProperty: 'TimeFrames',
          selectedMasterItemProperty: 'selectedTimeShift',
          message: MESSAGE
        });

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