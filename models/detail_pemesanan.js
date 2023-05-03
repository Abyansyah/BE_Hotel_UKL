'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class detail_pemesanan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.pemesanan);
      this.belongsTo(models.kamar);
    }
  }
  detail_pemesanan.init(
    {
      pemesananId: DataTypes.INTEGER,
      kamarId: DataTypes.INTEGER,
      tgl_akses: DataTypes.DATE,
      harga: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'detail_pemesanan',
    }
  );
  return detail_pemesanan;
};
