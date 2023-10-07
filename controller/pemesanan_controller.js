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
  let tipe_kamar = request.body.tipe_kamar;
  let nama_user = request.body.nama_user;

  let tipe = await tipeModel.findOne({
    where: {
      [Op.or]: [{ nama_tipe_kamar: { [Op.substring]: tipe_kamar } }],
    },
  });

  if (tipe == null) {
    return response.status(404).json({
      success: false,
      message: `Tipe Kamar ${tipe_kamar} tidak ditemukan`,
    });
  }

  let bookedRooms = await sequelize.query(`SELECT kamarId FROM detail_pemesanans WHERE tgl_akses BETWEEN "${request.body.tgl_check_in}" AND "${request.body.tgl_check_out}"`);
  let bookedRoomIds = bookedRooms[0].map((row) => row.kamarId);

  let rooms = await kamar.findAll({
    where: {
      [Op.and]: [{ tipeKamarId: tipe.id }, { id: { [Op.notIn]: bookedRoomIds } }],
    },
  });

  let user = await userModel.findOne({
    where: {
      [Op.or]: [{ nama_user: { [Op.substring]: nama_user } }],
    },
  });

  if (rooms.length === 0) {
    return response.status(404).json({
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
      tipeKamarId: tipe.id,
      status_pemesanan: 'baru',
      userId: user.id,
    };

    if (rooms.length !== 0) {
      let success = true;
      let message = '';

      let availableRooms = rooms.slice(0, newData.jumlah_kamar);

      if (availableRooms.length < newData.jumlah_kamar) {
        return response.json({
          success: false,
          message: `Hanya tersedia ${availableRooms.length} kamar untuk tipe kamar ${tipe_kamar}`,
        });
      }

      pemesananModel
        .create(newData)
        .then((result) => {
          let pemesananID = result.id;
          let detail_pemesanan = tipe.harga;

          let tgl_check_in = moment(request.body.tgl_check_in, 'YYYY-MM-DD');
          let tgl_check_out = moment(request.body.tgl_check_out, 'YYYY-MM-DD');
          let totalDays = tgl_check_out.diff(tgl_check_in, 'days');

          let totalHarga = tipe.harga * newData.jumlah_kamar * totalDays;

          for (let i = 0; i < detail_pemesanan.length; i++) {
            detail_pemesanan[i].pemesananId = pemesananID;
          }

          for (let m = moment(newData.tgl_check_in, 'YYYY-MM-DD'); m.isBefore(newData.tgl_check_out); m.add(1, 'days')) {
            let date = m.format('YYYY-MM-DD');

            for (let i = 0; i < availableRooms.length; i++) {
              let roomNumber = availableRooms.length > 1 ? `${availableRooms[i].nomor_kamar}-${m.diff(moment(request.body.tgl_check_in, 'YYYY-MM-DD'), 'days') + 1}` : availableRooms[i].nomor_kamar;

              let newDetail = {
                pemesananId: pemesananID,
                kamarId: availableRooms[i].id,
                tgl_akses: date,
                harga: totalHarga,
                nomor_kamar: roomNumber,
              };

              detail_pemesananModel.create(newDetail).catch((error) => {
                success = false;
                message = error.message;
              });
            }
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
  try {
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
        {
          model: detail_pemesananModel,
          as: 'detail_pemesanan',
          include: [
            {
              model: kamar,
              as: 'kamar',
              attributes: ['nomor_kamar'],
            },
          ],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    return response.status(200).json({
      success: true,
      data: data,
      message: `All data have been loaded`,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPemesananById = async (request, response) => {
  try {
    const { id } = request.params;
    const userReservations = await pemesananModel.findAll({
      where: {
        id: id,
      },
      include: [
        {
          model: tipeModel,
          attributes: ['nama_tipe_kamar', 'foto', 'nama_tipe_kamar', 'deskripsi', 'harga'],
        },
        {
          model: userModel,
          attributes: ['nama_user'],
        },
        {
          model: detail_pemesananModel,
          as: 'detail_pemesanan',
        },
      ],
    });

    const reservationsWithTotalHarga = userReservations.map((reservation) => {
      const totalHarga = reservation.detail_pemesanan.reduce((acc, detail) => {
        return acc + detail.harga * reservation.jumlah_kamar;
      }, 0);

      return {
        ...reservation.toJSON(),
        total_harga: totalHarga,
        detail_pemesanan_count: reservation.detail_pemesanan.length,
      };
    });

    if (reservationsWithTotalHarga.length === 0) {
      return response.status(404).json({
        success: false,
        message: `Reservation with ID ${id} not found`,
      });
    }

    return response.json({
      success: true,
      data: reservationsWithTotalHarga[0],
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

exports.findDatatgl = async (request, response) => {
  const { tgl_check_in } = request.query;

  const parsedDate = new Date(tgl_check_in);
  try {
    const pemesanans = await pemesananModel.findAll({
      where: {
        tgl_check_in: parsedDate,
      },
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
    });

    if (pemesanans.length === 0) {
      return response.status(404).json({
        success: false,
        message: `No bookings found for the specified date.`,
      });
    }

    return response.status(200).json({
      success: true,
      data: pemesanans,
      message: `Bookings for the specified date have been loaded`,
    });
  } catch (error) {
    response.status(500).json({ error: 'Internal server error' });
  }
};

exports.getDetailPemesananByUserId = async (request, response) => {
  try {
    const { userId } = request.params;

    const userReservations = await pemesananModel.findAll({
      where: {
        userId: userId,
      },
      include: [
        {
          model: tipeModel,
          attributes: ['id', 'nama_tipe_kamar', 'foto', 'nama_tipe_kamar', 'deskripsi', 'harga'],
        },
        {
          model: detail_pemesananModel,
          as: 'detail_pemesanan',
          include: [
            {
              model: kamar,
              as: 'kamar',
              attributes: ['nomor_kamar'],
            },
          ],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    const reservationsWithTotalHarga = userReservations.map((reservation) => {
      const totalHarga = reservation.detail_pemesanan.reduce((acc, detail) => {
        return acc + detail.harga * reservation.jumlah_kamar;
      }, 0);
      return {
        ...reservation.toJSON(),
        total_harga: totalHarga,
      };
    });

    return response.status(200).json({
      success: true,
      data: reservationsWithTotalHarga,
      message: 'User reservations fetched successfully',
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
