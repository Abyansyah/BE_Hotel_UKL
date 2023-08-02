const tipeModel = require('../models/index').tipe_kamar;
const kamarModel = require('../models/index').kamar;
const detail_pemesananModel = require('../models/index').detail_pemesanan;
const upload = require(`./upload_foto_tipe`).single(`foto`);
const Op = require(`sequelize`).Op;
const path = require(`path`);
const fs = require(`fs`);

exports.getAllTipekamar = async (request, response) => {
  let users = await tipeModel.findAll({ order: [['updatedAt', 'DESC']] });
  return response.json({
    success: true,
    data: users,
    count: users.length,
    message: `All tipe model have been loaded`,
  });
};

exports.getAvailableTipeKamar = async (request, response) => {
  try {
    const { tgl_check_in, tgl_check_out } = request.query;

    const bookedRooms = await detail_pemesananModel.findAll({
      where: {
        tgl_akses: {
          [Op.between]: [tgl_check_in, tgl_check_out],
        },
      },
      attributes: ['kamarId'],
    });

    const bookedRoomIds = bookedRooms.map((row) => row.kamarId);

    const availableKamars = await kamarModel.findAll({
      where: {
        id: {
          [Op.notIn]: bookedRoomIds,
        },
      },
      attributes: ['tipeKamarId'],
    });

    const availableTipeKamarIds = availableKamars.map((row) => row.tipeKamarId);

    const availableTipeKamar = await tipeModel.findAll({
      where: {
        id: {
          [Op.in]: availableTipeKamarIds,
        },
      },
    });

    return response.status(200).json({
      success: true,
      data: availableTipeKamar,
      message: 'Available tipe_kamar fetched successfully',
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.findTipeById = async (request, response) => {
  try {
    const { id } = request.params;
    const result = await tipeModel.findOne({ where: { id } });

    if (!result) {
      return response.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return response.status(200).json({
      success: true,
      data: result,
      message: `User with ID ${id} has been updated`,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      success: false,
      message: `Failed to get user with ID ${id}`,
    });
  }
};

exports.findTipekamar = async (request, response) => {
  let nama_tipe_kamar = request.body.nama_tipe_kamar;
  let tipe = await tipeModel.findAll({
    where: {
      [Op.or]: [{ nama_tipe_kamar: { [Op.substring]: nama_tipe_kamar } }],
    },
  });
  return response.json({
    success: true,
    data: tipe,
    message: `All Users have been loaded`,
  });
};

exports.addTipe = (request, response) => {
  upload(request, response, async (error) => {
    if (error) {
      return response.json({
        message: error,
      });
    }
    if (!request.file) {
      return response.json({
        message: `Nothing to Upload`,
      });
    }

    let newTipe = {
      nama_tipe_kamar: request.body.nama_tipe_kamar,
      harga: request.body.harga,
      deskripsi: request.body.deskripsi,
      foto: request.file.filename,
    };

    tipeModel
      .create(newTipe)
      .then((result) => {
        return response.json({
          success: true,
          data: result,
          message: `New User has been inserted`,
        });
      })
      .catch((error) => {
        return response.json({
          success: false,
          message: error.message,
        });
      });
  });
};

exports.updateTipe = (request, response) => {
  upload(request, response, async (error) => {
    if (error) {
      return response.json({ message: error });
    }

    let id = request.params.id;
    let tipe = {
      nama_tipe_kamar: request.body.nama_tipe_kamar,
      harga: request.body.harga,
      deskripsi: request.body.deskripsi,
    };

    if (request.file) {
      const selectedUser = await tipeModel.findOne({
        where: { id: id },
      });
      const oldCoverBook = selectedUser.foto;
      const pathCover = path.join(__dirname, `../foto_tipe_kamar`, oldCoverBook);
      if (fs.existsSync(pathCover)) {
        fs.unlink(pathCover, (error) => console.log(error));
      }
      tipe.foto = request.file.filename;
    }

    tipeModel
      .update(tipe, { where: { id: id } })
      .then((result) => {
        return response.json({
          success: true,
          message: `Data user has been updated`,
        });
      })
      .catch((error) => {
        return response.json({});
      });
  });
};

exports.deleteUser = async (request, response) => {
  const id = request.params.id;
  const user = await tipeModel.findOne({ where: { id: id } });
  const oldCoverBook = user.foto;
  const pathCover = path.join(__dirname, `../foto_tipe_kamar`, oldCoverBook);

  if (fs.existsSync(pathCover)) {
    fs.unlink(pathCover, (error) => console.log(error));
  }

  tipeModel
    .destroy({ where: { id: id } })
    .then((result) => {
      return response.json({
        success: true,
        message: `Data book has been deleted`,
      });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};
