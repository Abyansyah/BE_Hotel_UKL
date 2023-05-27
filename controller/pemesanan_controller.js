const pemesananModel = require(`../models/index`).pemesanan;
const detail_pemesananModel = require(`../models/index`).detail_pemesanan;
const kamar = require(`../models/index`).kamar;
const tipeModel = require(`../models/index`).tipe_kamar;
const userModel = require('../models/index').user;
const Op = require(`sequelize`).Op;
const moment = require(`moment`);
const crypto = require('crypto');
const Sequelize = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
});

exports.addPemesanan = async (request, response) => {
  let nomor_kamar = request.body.tipe_kamar;
  let nama_user = request.body.nama_user;

  let tipe = await tipeModel.findOne({
    where: {
      [Op.or]: [{ nama_tipe_kamar: { [Op.substring]: nomor_kamar } }],
    },
  });
  if (tipe == null) {
    return response.status(404).json({
      success: false,
      message: `Tipe Kamar ${nomor_kamar} tidak ditemukan`,
    });
  }

  let bookedRooms = await sequelize.query(`SELECT kamarId FROM detail_pemesanans WHERE tgl_akses BETWEEN "${request.body.tgl_check_in}" AND "${request.body.tgl_check_out}"`);
  let bookedRoomIds = bookedRooms[0].map((row) => row.kamarId);

  let room = await kamar.findOne({
    where: {
      [Op.and]: [{ tipeKamarId: tipe.id }, { id: { [Op.notIn]: bookedRoomIds } }],
    },
  });

  let user = await userModel.findOne({
    where: {
      [Op.or]: [{ nama_user: { [Op.substring]: nama_user } }],
    },
  });

  if (room === null) {
    return response.json({
      success: false,
      message: `Sudah habis mas`,
    });
  } else if (user === null) {
    return response.json({
      success: false,
      message: `User yang anda inputkan tidak ditemukan`,
    });
  } else {
    let date = moment();
    let tgl = date.format('YYYY-MM-DD');
    let randomString = crypto.randomBytes(10).toString('hex');
    let tgl_pesan = `${tgl}-${randomString}`;
    let newData = {
      nomor_pemesanan: tgl_pesan,
      nama_pemesanan: request.body.nama_pemesanan,
      email_pemesanan: request.body.email_pemesanan,
      tgl_pemesanan: request.body.tgl_pemesanan,
      tgl_check_in: request.body.tgl_check_in,
      tgl_check_out: request.body.tgl_check_out,
      nama_tamu: request.body.nama_tamu,
      jumlah_kamar: request.body.jumlah_kamar,
      tipeKamarId: room.tipeKamarId,
      status_pemesanan: 'baru',
      userId: user.id,
    };

    let roomCheck = await sequelize.query(`SELECT * FROM detail_pemesanans WHERE kamarId = ${newData.tipeKamarId} AND tgl_akses= "${request.body.tgl_check_in}"`);

    if (roomCheck[0].length === 0) {
      pemesananModel
        .create(newData)
        .then((result) => {
          let pemesananID = result.id;
          let detail_pemesanan = request.body.detail_pemesanan;

          for (let i = 0; i < detail_pemesanan.length; i++) {
            detail_pemesanan[i].pemesananId = pemesananID;
          }
          let tgl1 = new Date(request.body.tgl_check_in);
          let tgl2 = new Date(request.body.tgl_check_out);
          let checkIn = moment(tgl1).format('YYYY-MM-DD');
          let checkOut = moment(tgl2).format('YYYY-MM-DD');

          if (!moment(checkIn, 'YYYY-MM-DD').isValid() || !moment(checkOut, 'YYYY-MM-DD').isValid()) {
            return response.status(400).send({ message: 'Invalid date format' });
          }

          let success = true;
          let message = '';

          for (let m = moment(checkIn, 'YYYY-MM-DD'); m.isBefore(checkOut); m.add(1, 'days')) {
            let date = m.format('YYYY-MM-DD');
            let newDetail = {
              pemesananId: pemesananID,
              kamarId: room.id,
              tgl_akses: date,
              harga: detail_pemesanan[0].harga,
            };
            detail_pemesananModel.create(newDetail).catch((error) => {
              success = false;
              message = error.message;
            });
          }
          if (success) {
            return response.json({
              success: true,
              message: `New transactions have been inserted`,
            });
          } else {
            return response.json({
              success: false,
              message: message,
            });
          }
        })
        .catch((error) => {
          return response.json({
            success: false,
            message: error.message,
          });
        });
    } else {
      return response.json({
        success: false,
        message: `Kamar yang anda pesan sudah di booking`,
      });
    }
  }
};

exports.updatePemesanan = async (request, response) => {
  let nomor_kamar = request.body.tipe_kamar;
  let nama_user = request.body.nama_user;
  let tipe = await tipeModel.findOne({
    where: {
      [Op.or]: [{ nama_tipe_kamar: { [Op.substring]: nomor_kamar } }],
    },
  });

  if (tipe == null) {
    return response.status(404).json({
      success: false,
      message: `Tipe Kamar ${nomor_kamar} tidak ditemukan`,
    });
  }

  let userId = await userModel.findOne({
    where: {
      [Op.or]: [{ nama_user: { [Op.substring]: nama_user } }],
    },
  });

  let newData = {
    nama_pemesanan: request.body.nama_pemesanan,
    email_pemesanan: request.body.email_pemesanan,
    tgl_pemesanan: request.body.tgl_pemesanan,
    tgl_check_in: request.body.tgl_check_in,
    tgl_check_out: request.body.tgl_check_out,
    nama_tamu: request.body.nama_tamu,
    jumlah_kamar: request.body.jumlah_kamar,
    status_pemesanan: request.body.status_pemesanan,
    userId: userId.id,
  };

  let bookedRooms = await sequelize.query(`SELECT kamarId FROM detail_pemesanans WHERE tgl_akses BETWEEN "${newData.tgl_check_in}" AND "${newData.tgl_check_out}"`);
  let bookedRoomIds = bookedRooms[0].map((row) => row.kamarId);

  let room = await kamar.findOne({
    where: {
      [Op.and]: [{ tipeKamarId: tipe.id }, { id: { [Op.notIn]: bookedRoomIds } }],
    },
  });

  if (room !== undefined) {
    newData.tipeKamarId = room.tipeKamarId;
  }

  for (const [key, value] of Object.entries(newData)) {
    if (!value || value === '') {
      console.log(`Error: ${key} is empty`);
      return response.status(400).json({
        error: `${key} kosong Harus diisi kalau tidak ingin merubah, isi dengan value sebelumnya`,
      });
    }
  }

  let pemesananID = request.params.id;
  let getId = await pemesananModel.findAll({
    where: {
      [Op.and]: [{ id: pemesananID }],
    },
  });
  if (getId.length === 0) {
    return response.json({
      success: false,
      message: 'Transaksi dengan id tersebut tidak ada',
    });
  }

  pemesananModel
    .update(newData, { where: { id: pemesananID } })
    .then(async (result) => {
      await detail_pemesananModel.destroy({
        where: { pemesananId: pemesananID },
      });

      let detail_pemesanan = request.body.detail_pemesanan;

      for (let i = 0; i < detail_pemesanan.length; i++) {
        detail_pemesanan[i].id_pemesanan = pemesananID;
      }

      let tgl1 = new Date(request.body.tgl_check_in);
      let tgl2 = new Date(request.body.tgl_check_out);
      let checkIn = moment(tgl1).format('YYYY-MM-DD');
      let checkOut = moment(tgl2).format('YYYY-MM-DD');

      if (!moment(checkIn, 'YYYY-MM-DD').isValid() || !moment(checkOut, 'YYYY-MM-DD').isValid()) {
        return response.status(400).send({ message: 'Invalid date format' });
      }

      let success = true;
      let message = '';

      for (let m = moment(checkIn, 'YYYY-MM-DD'); m.isBefore(checkOut); m.add(1, 'days')) {
        let date = m.format('YYYY-MM-DD');
        let newDetail = {
          pemesananId: pemesananID,
          kamarId: room.id,
          tgl_akses: date,
          harga: detail_pemesanan[0].harga,
        };
        detail_pemesananModel.create(newDetail).catch((error) => {
          success = false;
          message = error.message;
        });
      }

      if (success) {
        return response.json({
          success: true,
          message: `New transactions have been inserted`,
        });
      } else {
        return response.json({
          success: false,
          message: message,
        });
      }
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};

exports.updateStatus = async (request, response) => {
  let newData = {
    status_pemesanan: request.body.status_pemesanan,
  };

  let pemesananID = request.params.id;
  let getId = await pemesananModel.findAll({
    where: {
      [Op.and]: [{ id: pemesananID }],
    },
  });

  if (getId.length === 0) {
    return response.json({
      success: false,
      message: 'Transaksi dengan id tersebut tidak ada',
    });
  }

  pemesananModel
    .update(newData, { where: { id: pemesananID } })
    .then((result) => {
      return response.json({
        success: true,
        message: `Status pemesanan berhasil diperbarui`,
      });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};

exports.deletePemesanan = async (request, response) => {
  let pemesananID = request.params.id;
  let getId = await pemesananModel.findAll({
    where: {
      [Op.and]: [{ id: pemesananID }],
    },
  });
  if (getId.length === 0) {
    return response.json({
      success: false,
      message: 'Transaksi dengan id tersebut tidak ada',
    });
  }

  detail_pemesananModel
    .destroy({
      where: { pemesananId: pemesananID },
    })
    .then((result) => {
      pemesananModel
        .destroy({ where: { id: pemesananID } })
        .then((result) => {
          return response.json({
            success: true,
            message: `Transaction has been deleted`,
          });
        })
        .catch((error) => {
          return response.json({
            success: false,
            message: error.message,
          });
        });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};

exports.getPemesanan = async (request, response) => {
  let data = await pemesananModel.findAll({
    include: [
      {
        model: userModel,
        attributes: ['nama_user'],
      },
      {
        model: tipeModel,
        attributes: ['nama_tipe_kamar'],
      },
    ],
    order: [['updatedAt', 'DESC']],
  });
  return response.json({
    success: true,
    data: data,
    message: `All  have been loaded`,
  });
};

exports.getPemesananById = async (request, response) => {
  try {
    const { id } = request.params;
    let data = await pemesananModel.findOne({
      include: [
        {
          model: userModel,
          attributes: ['nama_user'],
        },
        {
          model: tipeModel,
          attributes: ['nama_tipe_kamar'],
        },
      ],
      where: { id },
    });
    return response.json({
      success: true,
      data: data,
      message: `All  have been loaded`,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      success: false,
      message: `Failed to get user with ID ${id}`,
    });
  }
};
