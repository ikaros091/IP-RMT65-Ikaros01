'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MyList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
       // Relasi dengan User
      MyList.belongsTo(models.User, { foreignKey: 'user_id' });
      // Relasi dengan Anime
      MyList.belongsTo(models.Anime, { foreignKey: 'anime_id' });
    }
  }
  MyList.init({
     user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      anime_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'planned'
      }
  }, {
    sequelize,
    modelName: 'MyList',
  });
  return MyList;
};