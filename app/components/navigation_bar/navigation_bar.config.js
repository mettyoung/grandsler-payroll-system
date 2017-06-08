require('./navigation_bar.module');

angular.module('navigation-bar')
  .config(['$mdIconProvider', $mdIconProvider =>
  {
    $mdIconProvider.iconSet('social', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-social.svg');
    $mdIconProvider.iconSet('hardware', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-hardware.svg');
  }]);