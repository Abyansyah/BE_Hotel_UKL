const tipeModel = require('../models/index').tipe_kamar;
const upload = require(`./upload_foto_tipe`).single(`foto`);
const Op = require(`sequelize`).Op;
const path = require(`path`);
const fs = require(`fs`);
const md5 = require('md5');

exports.getAllTipekamar = async (request, response) => {
  let users = await tipeModel.findAll({ order: [['updatedAt', 'DESC']] });
  return response.json({
    success: true,
    data: users,
    message: `All tipe model have been loaded`,
  });
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
      foto: request.file.filename,
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
