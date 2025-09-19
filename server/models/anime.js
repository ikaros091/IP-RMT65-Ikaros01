'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Anime extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Anime.hasMany(models.MyList, { foreignKey: 'anime_id' });
    }
  }
  Anime.init({
    jikan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
      },
    title: DataTypes.STRING,
    image_url: DataTypes.STRING,
    episodes: DataTypes.INTEGER,
    status: DataTypes.STRING,
    score: DataTypes.FLOAT,
    synopsis: DataTypes.TEXT,
    genres: DataTypes.TEXT,
    demographics: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Anime',
  });
  return Anime;
};