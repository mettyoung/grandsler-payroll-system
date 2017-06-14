angular.module('production-order-dialog')
  .config(['$mdIconProvider', $mdIconProvider =>
  {
    $mdIconProvider.iconSet('content', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-content.svg');
    $mdIconProvider.iconSet('image', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-image.svg');
  }]);