'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Users.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    nickname: {
      type: DataTypes.STRING,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    points: DataTypes.INTEGER,
    key: {
      type: DataTypes.STRING,
      unique: true,
    },
    validated: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      allowNull: false
    },
    opts: {
      type: DataTypes.JSON,
      get() {
        let opts = this.getDataValue('opts') === undefined ? '{}' : this.getDataValue('opts');
        return JSON.parse(opts);
      },
      set(data) {
        this.setDataValue('opts', JSON.stringify(data));
      }
    },
    last_login: {
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'Users',
  });
  return Users;
};
