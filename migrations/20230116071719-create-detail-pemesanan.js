'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('detail_pemesanans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      pemesananId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'pemesanans',
          key: 'id',
        },
      },
      kamarId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'kamars',
          key: 'id',
        },
      },
      tgl_akses: {
        type: Sequelize.DATE,
      },
      harga: {
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('detail_pemesanans');
  },
};
