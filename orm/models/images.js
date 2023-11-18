'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Images extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Images.init({
    data64: DataTypes.TEXT,
    answer: DataTypes.STRING,
    validated: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Images',
  });
  return Images;
};