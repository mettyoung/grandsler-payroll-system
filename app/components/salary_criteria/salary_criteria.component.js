angular.module('salary-criteria')
  .component('salaryCriteria', {
    templateUrl: './components/salary_criteria/salary_criteria.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider',
      function ($scope, $mdDialog, Notifier, ModelProvider)
      {
        /**
         * Loads the overtime and night differential view models from the database.
         */
        this.load = () =>
          ModelProvider.models.SALARY_CRITERION.findAll({
            order: 'name',
            where: {
              name: {
                $in: ['Overtime', 'Night-differential']
              }
            }
          }).then(salaryCriteria =>
          {
            this.night_differential = salaryCriteria[0];
            this.overtime = salaryCriteria[1];
          }).catch(error => this.preload_error = error)
            .then(() => $scope.$apply());

        /**
         * Stores the initial loading to the Promise variable to be used in tests.
         * @type Promise.
         */
        this.notifyOnLoad = this.load();

        /**
         * Saves the overtime and night-differential models.
         * @param transaction to be passed in tests.
         * @returns {Promise}
         * @private
         */
        const _save = (transaction) =>
        {
          return Promise.all([
            this.night_differential.save({transaction: transaction}),
            this.overtime.save({transaction: transaction})
          ]);
        };


        /**
         * Used to only allow one save at a time.
         * @type {boolean}
         */
        let isSaveIdle = true;
        
        /**
         * Saves the overtime and night differential.
         * @param transaction
         * @returns {*}
         */
        this.save = (transaction) =>
        {
          if (isSaveIdle)
          {
            isSaveIdle = false;
            let transactionPromise;
            let options = {};
            if (transaction)
            {
              transactionPromise = _save(transaction);
              options = {transaction: transaction};
            }
            else
              transactionPromise = ModelProvider.sequelize.transaction(_save);

            return Notifier.perform(() =>
            {
              return transactionPromise
                .then(() =>
                {
                  this.cancel();
                  this.save_error = null;
                  return {
                    module: 'Salary Criteria Registry',
                    description: 'Changed salary criteria successfully!'
                  };
                });
            }, options).catch(error =>
            {
              this.save_error = error;
            }).then(() => $scope.$apply())
              .then(() => isSaveIdle = true);
          }
        };

        /**
         * Hides the dialog.
         * @returns {Promise}
         */
        this.cancel = function ()
        {
          return $mdDialog.hide();
        };
      }]
  });