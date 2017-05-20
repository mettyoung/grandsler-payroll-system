angular.module('action-bar')
  .config(['$mdIconProvider', $mdIconProvider =>
  {
    $mdIconProvider.iconSet('navigation', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-navigation.svg');
  }]);