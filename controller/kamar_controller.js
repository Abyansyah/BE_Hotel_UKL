const kamarModel = require('../models/index').kamar;
const tipeKamar = require('../models/index').tipe_kamar;
const detail_pemesanan = require('../models/index').detail_pemesanan;
const Op = require('sequelize').Op;
const sequelize = require('sequelize');

exports.getAllkamar = async (request, response) => {
  const result = await kamarModel.findAll({
    include: {
      model: tipeKamar,
      attributes: ['nama_tipe_kamar'],
    },
    order: [['updatedAt', 'DESC']],
  });

  if (result === '') {
    response.status(404).json({
      message: 'Kamar not found',
    });
  }

  return response.json({
    success: true,
    data: result,
    count: result.length,
    message: `Kamar have been loaded`,
  });
};

exports.getAvaible = async (request, response) => {
  try {
    const { tgl_check_in, tgl_check_out } = request.query;

    const availableKamar = await kamarModel.findAll({
      include: {
        model: detail_pemesanan,
        as: 'detail_pemesanan',
        required: false,
        where: {
          pemesananId: null,
          [sequelize.Op.or]: [
            {
              tgl_akses: {
                [sequelize.Op.lt]: new Date(tgl_check_in),
              },
            },
            {
              tgl_akses: {
                [sequelize.Op.gt]: new Date(tgl_check_out),
              },
            },
          ],
        },
      },
      attributes: ['nomor_kamar'],
      order: [['updatedAt', 'DESC']],
    });

    if (!availableKamar || availableKamar.length === 0) {
      return response.status(404).json({
        message: 'No available rooms found for the specified dates',
        success: false,
      });
    }

    const availableRooms = availableKamar.map((room) => room.nomor_kamar);

    return response.status(200).json({
      success: true,
      data: availableRooms,
      count: availableRooms.length,
      message: 'Available rooms have been loaded',
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      message: 'Internal server error',
    });
  }
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

exports.findTipeById = async (request, response) => {
  try {
    const { id } = request.params;
    const result = await kamarModel.findOne({
      include: {
        model: tipeKamar,
        attributes: ['nama_tipe_kamar'],
      },
      where: { id },
    });

    if (!result) {
      return response.status(404).json({
        success: false,
        message: 'Kamar not found',
      });
    }

    return response.status(200).json({
      success: true,
      data: result,
      message: `Kamar with ID ${id} has been updated`,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      success: false,
      message: `Failed to get user with ID ${id}`,
    });
  }
};

exports.findTipK = async (request, response) => {
  const { tipeKamarId } = request.params;
  const tgl_check_in = request.query.tgl_check_in;
  const tgl_check_out = request.query.tgl_check_out;

  if (!tipeKamarId || !tgl_check_in || !tgl_check_out) {
    return response.status(400).json({
      success: false,
      message: 'Missing required parameters: tipeKamarId, tgl_check_in, and tgl_check_out',
    });
  }

  try {
    // Find booked rooms within the specified date range
    const bookedRooms = await detail_pemesanan.findAll({
      where: {
        tgl_akses: {
          [Op.between]: [tgl_check_in, tgl_check_out],
        },
      },
      attributes: ['kamarId'],
    });

    const bookedRoomIds = bookedRooms.map((row) => row.kamarId);

    // Find available rooms for the given tipeKamarId that are not booked
    const availableRooms = await kamarModel.findAll({
      where: {
        tipeKamarId: tipeKamarId,
        id: {
          [Op.notIn]: bookedRoomIds,
        },
      },
    });

    if (availableRooms.length === 0) {
      return response.status(404).json({
        success: false,
        message: `No available rooms with tipeKamarId ${tipeKamarId} for the specified date range`,
      });
    } else {
      return response.status(200).json({
        success: true,
        data: availableRooms,
        count: availableRooms.length,
      });
    }
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addKamar = async (request, response) => {
  let nama_tipe_kamar = request.body.nama_tipe_kamar;
  let jumlah_kamar = parseInt(request.body.jumlah_kamar); // Parse jumlah_kamar as an integer

  let tipe_Kamar = await tipeKamar.findOne({
    where: {
      [Op.or]: [{ nama_tipe_kamar: { [Op.substring]: nama_tipe_kamar } }],
    },
  });

  if (tipe_Kamar === null) {
    response.json({
      success: false,
      message: `Tidak ada tipe kamar dengan nama : ${nama_tipe_kamar}`,
    });
  } else {
    let lastRoomNumber = await kamarModel.findOne({
      where: { tipeKamarId: tipe_Kamar.id },
      order: [['nomor_kamar', 'DESC']],
    });

    let startingRoomNumber = lastRoomNumber ? parseInt(lastRoomNumber.nomor_kamar) + 1 : 1;
    let newKamarList = [];

    for (let i = 0; i < jumlah_kamar; i++) {
      // Loop based on jumlah_kamar
      let nomor = (startingRoomNumber + i).toString();
      let nomork = await kamarModel.findOne({
        where: {
          [Op.and]: [{ nomor_kamar: { [Op.substring]: nomor } }, { tipeKamarId: tipe_Kamar.id }],
        },
      });

      if (nomork === null) {
        newKamarList.push({
          nomor_kamar: nomor,
          tipeKamarId: tipe_Kamar.id,
        });
      }
    }

    if (newKamarList.length === 0) {
      response.json({
        success: false,
        message: `All room numbers already exist for the given room type`,
      });
    } else {
      kamarModel
        .bulkCreate(newKamarList)
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
