const process = require('process');

angular.module('time-shift-registry')
  .component('timeShiftRegistry', {
    templateUrl: './components/time_shift_registry/time_shift_registry.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider',
      function ($scope, $mdDialog, Notifier, ModelProvider)
      {
        /**
         * Constants
         */
        const EXPECTED_MESSAGE = {
          created: {
            module: 'Time Shift Registry',
            description: 'Created a time-shift successfully!'
          },
          deleted: {
            module: 'Time Shift Registry',
            description: 'Deleted a time-shift successfully!'
          },
          modified: {
            module: 'Time Shift Registry',
            description: 'Modified a time-shift successfully!'
          }
        };

        /**
         * View Models
         */
        this.timeShifts = [];
        this.selectedTimeShift = null;

        /**
         * Commands
         */

        /**
         * Creates a new time shift.
         */
        this.createTimeShift = () =>
        {
          this.selectedTimeShift = {TimeFrames: []};
          // Set it to untouched to reset validations.
          this.Form.$setUntouched();
        };

        /**
         * Creates a new time frame.
         */
        this.createTimeFrame = () => this.selectedTimeShift.TimeFrames.push({});

        /**
         * Master selector.
         * @param timeShift
         */
        this.selectTimeShift = (timeShift, transaction) => timeShift.reload({transaction: transaction})
          .then(() =>
            {
              this.selectedTimeShift = timeShift;
              $scope.$apply();
            }
          );

        this.deleteTimeShift = (event) =>
        {
          var confirm = $mdDialog.confirm()
            .title('Confirmation')
            .textContent('Are you sure you want to delete this entry?')
            .ariaLabel('Confirmation')
            .targetEvent(event)
            .ok('Yes')
            .cancel('No');

          confirm._options.multiple = true;
          $mdDialog.show(confirm).then(() => this.delete(), () => (0));
        };

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
              this.selectedTimeShift = this.timeShifts[0];
          }).catch(error => this.preload_error = error)
            .then(() => $scope.$apply());

        /**
         * Saves the selected time-shift.
         * @param transaction
         * @returns {Promise} if executed; {undefined} otherwise.
         */
        this.save = transaction => _write(transaction, _save);


        /**
         * Deletes the selected time-shift.
         * @param transaction
         * @returns {Promise} if executed; {undefined} otherwise.
         */
        this.delete = transaction => _write(transaction, _delete);

        /**
         * Hides the dialog.
         * @returns {Promise}
         */
        this.close = function ()
        {
          return $mdDialog.hide();
        };

        /**
         * If environment is not production or dev, then preload the module.
         */
        if (process.env.NODE_ENV !== 'test')
          this.load();

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
              transactionPromise = operation(transaction);
            else
              transactionPromise = ModelProvider.sequelize.transaction(operation);

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
          if (this.selectedTimeShift.constructor == Object)
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