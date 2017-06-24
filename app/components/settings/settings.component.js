angular.module('settings')
  .component('settings', {
    templateUrl: './components/settings/settings.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider', 'CrudHandler',
      function ($scope, $mdDialog, Notifier, ModelProvider, CrudHandler)
      {
        /**
         * Life cycles
         */
        {
          CrudHandler.onPreload(this, transaction => ModelProvider.models.Meta.findOne({
            where: {
              particular: 'tolerable_threshold'
            },
            transaction: transaction
          }).then(tolerable_threshold =>
          {
            this._tolerable_threshold = tolerable_threshold;
            this.tolerable_threshold = Number(tolerable_threshold.value);
          }));

          CrudHandler.onSaveSelectedMasterItem(this, transaction =>
            Notifier.perform(() =>
              Object.assign(this._tolerable_threshold, {value: this.tolerable_threshold}).save({transaction}).then(() =>
              {
                this.commands.close();
                return {
                  module: 'Settings',
                  description: 'Changed tolerable threshold!'
                };
              }), transaction));
        }

        CrudHandler.bootstrap(this, $scope);

        /**
         * Hides the dialog.
         * @returns {Promise}
         */
        this.commands.close = function ()
        {
          return $mdDialog.hide();
        };
      }]
  });