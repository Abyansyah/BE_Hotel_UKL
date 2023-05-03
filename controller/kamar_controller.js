const kamarModel = require('../models/index').kamar;
const tipeKamar = require('../models/index').tipe_kamar;
const Op = require('sequelize').Op;
const Sequelize = require('sequelize');
const sequelize = new Sequelize('wikusama_hotel', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
});

exports.getAllkamar = async (request, response) => {
  const result = await kamarModel.findAll({ order: [['updatedAt', 'DESC']] });

  if (result === '') {
    response.status(404).json({
      message: 'Kamar not found',
    });
  }

  return response.json({
    success: true,
    data: result,
    message: `Kamar have been loaded`,
  });
};

exports.findKamar = async (request, response) => {
  let nomor_kamar = request.body.nomor_kamar;

  let result = await kamarModel.findAll({
    where: {
      [Op.or]: [{ nomor_kamar: { [Op.substring]: nomor_kamar } }],
    },
  });
  return response.json({
    success: true,
    data: result,
    message: `Kamar have been loaded`,
  });
};

exports.findTipK = async (request, response) => {
  let nama_tipe = request.body.nama_tipe;

  let checkTipe = await tipeKamar.findOne({
    where: {
      [Op.or]: [{ nama_tipe_kamar: { [Op.substring]: nama_tipe } }],
    },
  });

  if (checkTipe === null) {
    response.status(404).json({
      success: true,
      message: `Tidak ada tipe kamar ${nama_tipe}`,
    });
  } else {
    let result = await kamarModel.findAll({
      where: {
        [Op.or]: [{ tipeKamarId: checkTipe.id }],
      },
    });
    response.status(200).json({
      success: true,
      data: result,
    });
  }
};

exports.addKamar = async (request, response) => {
  let nomor = request.body.nomor_kamar;
  let nama_tipe_kamar = request.body.nama_tipe_kamar;
  let tipe_Kamar = await tipeKamar.findOne({
    where: {
      [Op.or]: [{ nama_tipe_kamar: { [Op.substring]: nama_tipe_kamar } }],
    },
  });
  let nomork = await kamarModel.findOne({
    where: {
      [Op.and]: [{ nomor_kamar: { [Op.substring]: nomor } }, { tipeKamarId: tipe_Kamar.id }],
    },
  });

  if (tipe_Kamar === null) {
    response.json({
      success: false,
      message: `Tidak ada tipe kamar dengan nama : ${nama_tipe_kamar}`,
    });
  }
  if (nomork !== null) {
    response.json({
      success: false,
      message: `Nomor kamar  ${nomor} sudah ada`,
    });
  } else {
    let newKamar = {
      nomor_kamar: nomor,
      tipeKamarId: tipe_Kamar.id,
    };

    kamarModel
      .create(newKamar)
      .then((result) => {
        return response.json({
          success: true,
          data: result,
          message: `New Kamar has been inserted`,
        });
      })
      .catch((error) => {
        return response.json({
          success: false,
          message: error.message,
        });
      });
  }
};

exports.updateKamar = async (request, response) => {
  let searchKamar = request.params.id;
  let nama_tipe_kamar = request.body.nama_tipe_kamar;
  let tipe_Kamar = await tipeKamar.findOne({
    where: {
      [Op.or]: [{ nama_tipe_kamar: { [Op.substring]: nama_tipe_kamar } }],
    },
  });

  let newKamar = {
    nomor_kamar: request.body.nomor_kamar,
    tipeKamarId: tipe_Kamar.id,
  };

  kamarModel
    .update(newKamar, { where: { id: searchKamar } })
    .then((result) => {
      return response.json({
        success: true,
        message: `Data kamar has been updated`,
      });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};

exports.deleteKamar = (request, response) => {
  let idAdmin = request.params.id;

  kamarModel
    .destroy({ where: { id: idAdmin } })
    .then((result) => {
      return response.json({
        success: true,
        message: `Data admin has been updated`,
      });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};
