'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('User', {  
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
    // employee_id: {
    //   type: Sequelize.INTEGER,
    //   references: {
    //     model: Employee,
    //     key: 'id'
    // }
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    },
    underscored: true,
    tableName: "users"
});