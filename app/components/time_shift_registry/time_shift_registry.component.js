const process = require('process');

angular.module('time-shift-registry')
  .component('timeShiftRegistry', {
    templateUrl: './components/time_shift_registry/time_shift_registry.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider', 'CustomValidator',
      function ($scope, $mdDialog, Notifier, ModelProvider, CustomValidator)
      {
        /**
         * Constants...................................................................
         */
        const EXPECTED_MESSAGE = {
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
         * View Models...................................................................
         */
        this.timeShifts = [];
        this.selectedTimeShift = null;
        this.disableDeleteButton = true;

        /**
         * Commands...................................................................
         */

        /**
         * Creates a new time shift.
         */
        this.createTimeShift = () =>
        {
          this.disableDeleteButton = true;
          this.selectedTimeShift = {TimeFrames: []};
          // Set it to untouched to reset validations.
          this.Form.$setUntouched();
        };

        /**
         * Marks the time-shift as selected time-shift.
         * @param timeShift
         */
        this.selectTimeShift = (timeShift, transaction) => timeShift.reload({transaction: transaction})
          .then(() =>
            {
              this.disableDeleteButton = false;
              this.selectedTimeShift = timeShift;
              $scope.$apply();
            }
          );

        /**
         * Deletes the selected time shift.
         * @param event
         */
        this.deleteSelectedTimeShift = (event) =>
        {
          var confirm = $mdDialog.confirm()
            .title('Confirmation')
            .textContent('Are you sure you want to delete this time-shift?')
            .ariaLabel('Confirmation')
            .targetEvent(event)
            .ok('Yes')
            .cancel('No');

          confirm._options.multiple = true;
          $mdDialog.show(confirm).then(() => this._deleteSelectedTimeShift(), () => (0));
        };

        /**
         * Creates a new time frame.
         */
        this.createTimeFrame = () => this.selectedTimeShift.TimeFrames.push({});

        /**
         * Deletes the time frame.
         * @param timeFrame timeFrame to be deleted.
         * @param event
         */
        this.deleteTimeFrame = (timeFrame, event) =>
        {
          var confirm = $mdDialog.confirm()
            .title('Confirmation')
            .textContent('Are you sure you want to delete this time-frame?')
            .ariaLabel('Confirmation')
            .targetEvent(event)
            .ok('Yes')
            .cancel('No');

          confirm._options.multiple = true;
          $mdDialog.show(confirm).then(() => _deleteTimeFrame(timeFrame), () => (0));
        };

        /**
         * Saves the selected time-shift.
         * @param transaction
         * @returns {Promise} if executed; {undefined} otherwise.
         */
        this.save = transaction => _write(transaction, _save);

        /**
         * Hides the dialog.
         * @returns {Promise}
         */
        this.close = function ()
        {
          return $mdDialog.hide();
        };

        /**
         * Service layer...................................................................
         */

        /**
         * Loads the time-shifts and salary criteria from the database.
         */
        this.load = (transaction) =>
          Promise.all([
            ModelProvider.models.TimeShift.findAll({
              include: [ModelProvider.models.TimeFrame],
              transaction: transaction
            }),
            ModelProvider.models.SALARY_CRITERION.findAll({
              transaction: transaction
            })
          ]).then(values =>
          {
            this.timeShifts = values[0];
            this.SALARY_CRITERIA = values[1];

            if (this.timeShifts.length > 0)
            {
              this.selectedTimeShift = this.timeShifts[0];
              this.disableDeleteButton = false;
            }
          }).catch(error => this.preload_error = error)
            .then(() => $scope.$apply());

        /**
         * If environment is not production or dev, then preload the module.
         */
        if (process.env.NODE_ENV !== 'test')
          this.load();

        /**
         * Deletes the selected time-shift.
         * @param transaction
         * @returns {Promise} if executed; {undefined} otherwise.
         */
        this._deleteSelectedTimeShift = transaction => _write(transaction, _delete);

        /**
         * Deletes the time-frame without the dialog.
         * @param timeFrame
         * @private
         */
        this._deleteTimeFrame = (timeFrame) =>
        {
          this.selectedTimeShift.TimeFrames
            .splice(this.selectedTimeShift.TimeFrames.indexOf(timeFrame),1);
        };

        /**
         * Executes before saving.
         * @param timeShift
         * @returns {Promise}
         */
        const onBeforeSave = timeShift =>
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
              message: 'Time frames must not be overlapping'
            });

          return Promise.resolve();
        };

        /**
         * Used to only allow one delete/save at a time.
         * @type {boolean}
         */
        let isWriteIdle = true;

        /**
         * Common method for save and delete. Can only permit save and delete at a time.
         * @param transaction
         * @param operation _save or _delete
         * @returns {Promise}
         * @private
         */
        const _write = (transaction, operation) =>
        {
          if (isWriteIdle)
          {
            isWriteIdle = false;
            let transactionPromise;
            if (transaction)
              transactionPromise = onBeforeSave(this.selectedTimeShift).then(() => operation(transaction));
            else
              transactionPromise = onBeforeSave(this.selectedTimeShift).then(() =>
                ModelProvider.sequelize.transaction(operation));

            return transactionPromise.then(() => this.write_error = null)
              .catch(error => this.write_error = error)
              .then(() => $scope.$apply())
              .then(() => isWriteIdle = true);
          }
        };

        /**
         * Saves the time-shift and logs to user logs.
         * @param transaction to be passed in tests.
         * @returns {Promise}
         * @private
         */
        const _save = (transaction) =>
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
              return EXPECTED_MESSAGE[action];
            }), transaction);
        };

        /**
         * Deletes the selected time-shift and logs to user logs.
         * @param transaction to be passed in tests.
         * @returns {Promise}
         * @private
         */
        const _delete = (transaction) =>
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
              return EXPECTED_MESSAGE.deleted;
            });
          }, transaction);
        };
      }]
  });