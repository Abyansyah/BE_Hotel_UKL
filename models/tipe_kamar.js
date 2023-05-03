'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tipe_kamar extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.kamar, {
        foreignKey: 'tipeKamarId',
        as: 'kamar',
      });
      this.hasMany(models.pemesanan, {
        foreignKey: 'tipeKamarId',
        as: 'pemesanan',
      });
    }
  }
  tipe_kamar.init(
    {
      nama_tipe_kamar: DataTypes.STRING,
      harga: DataTypes.INTEGER,
      deskripsi: DataTypes.TEXT,
      foto: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'tipe_kamar',
    }
  );
  return tipe_kamar;
};
