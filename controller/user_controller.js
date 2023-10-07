const userModel = require('../models/index').user;
const upload = require(`./upload_foto_user`).single(`foto`);
const Op = require(`sequelize`).Op;
const path = require(`path`);
const fs = require(`fs`);
const md5 = require('md5');
require('dotenv').config();

const jsonwebtoken = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

exports.login = async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email) {
      return response.status(400).json({
        message: 'Email wajib diisi',
      });
    }

    if (!password) {
      return response.status(400).json({
        message: 'Kata sandi wajib diisi',
      });
    }

    const params = {
      email: request.body.email,
      password: md5(request.body.password),
    };

    const findUser = await userModel.findOne({ where: params });
    if (findUser == null) {
      return response.status(404).json({
        message: "email or password doesn't match",
        err: error,
      });
    }

    let tokenPayLoad = {
      id_user: findUser.id,
      email: findUser.email,
      role: findUser.role,
    };
    tokenPayLoad = JSON.stringify(tokenPayLoad);
    let token = await jsonwebtoken.sign(tokenPayLoad, SECRET_KEY);

    return response.status(200).json({
      success: true,
      message: 'Success login',
      data: {
        token: token,
        id_user: findUser.id,
        nama_user: findUser.nama_user,
        email: findUser.email,
        role: findUser.role,
        foto: findUser.foto,
      },
    });
  } catch (error) {
    console.log(error);
    return response.status(404).json({
      message: 'Internal error',
      err: error,
    });
  }
};

exports.getAllUser = async (request, response) => {
  let users = await userModel.findAll({ order: [['updatedAt', 'DESC']] });

  const filteredUsers = users.filter((user) => user.role !== 'tamu');

  try {
    return response.json({
      success: true,
      count: filteredUsers.length,
      data: filteredUsers,
      message: `All Users have been loaded`,
    });
  } catch (error) {
    return response.json.status(500)({
      success: false,
      message: `Internal server error`,
    });
  }
};

exports.findUserById = async (request, response) => {
  try {
    const { id } = request.params;
    const result = await userModel.findOne({ where: { id } });

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

exports.findUser = async (request, response) => {
  const nama = request.body.nama_user;
  const users = await userModel.findOne({
    where: {
      [Op.or]: [{ nama_user: { [Op.substring]: nama } }],
    },
  });

  if (users == null) {
    return response.status(404).json({
      success: true,
      message: `User dengan nama '${nama}' tidak ditemukan`,
    });
  }
  return response.status(200).json({
    success: true,
    data: users,
    message: `All Users have been loaded`,
  });
};

exports.addUser = (request, response) => {
  upload(request, response, async (error) => {
    if (error) {
      return response.status(500).json({
        success: false,
        message: error,
      });
    }
    if (!request.file) {
      return response.status(400).json({
        success: false,
        message: `Nothing to Upload`,
      });
    }

    let newUser = {
      nama_user: request.body.nama_user,
      foto: request.file.filename,
      email: request.body.email,
      password: md5(request.body.password),
      role: request.body.role,
    };

    userModel
      .findOne({
        where: [{ email: { [Op.substring]: newUser.email } }],
      })
      .then((existingUser) => {
        if (existingUser) {
          return response.status(208).json({
            success: false,
            message: 'Email tersebut sudah ada',
          });
        } else {
          userModel
            .create(newUser)
            .then((result) => {
              return response.status(201).json({
                success: true,
                data: result,
                message: `New User has been inserted`,
              });
            })
            .catch((error) => {
              return response.status(500).json({
                success: false,
                message: error.message,
              });
            });
        }
      })
      .catch((error) => {
        return response.status(500).json({
          success: false,
          message: error.message,
        });
      });
  });
};

exports.updateUser = (request, response) => {
  upload(request, response, async (error) => {
    if (error) {
      return response.json({ message: error });
    }

    let idUser = request.params.id;

    let getId = await userModel.findAll({
      where: {
        [Op.and]: [{ id: idUser }],
      },
    });

    if (getId.length === 0) {
      return response.json({
        success: false,
        message: 'User dengan id tersebut tidak ada',
      });
    }

    let dataUser = {
      nama_user: request.body.nama_user,
      email: request.body.email,
      role: request.body.role,
    };

    if (request.body.password) {
      dataUser.password = md5(request.body.password);
    }

    if (request.file) {
      const selectedUser = await userModel.findOne({
        where: { id: idUser },
      });

      const oldFotoUser = selectedUser.foto;

      const patchFoto = path.join(__dirname, `../foto_user`, oldFotoUser);

      if (fs.existsSync(patchFoto)) {
        fs.unlink(patchFoto, (error) => console.log(error));
      }

      dataUser.foto = request.file.filename;
    }

    let user = await userModel.findAll({
      where: {
        [Op.and]: [
          { id: { [Op.ne]: idUser } },
          {
            [Op.or]: [{ nama_user: dataUser.nama_user }, { email: dataUser.email }],
          },
        ],
      },
    });

    if (user.length > 0) {
      return response.json({
        success: false,
        message: 'Cari nama atau email lain',
      });
    }

    userModel
      .update(dataUser, { where: { id: idUser } })
      .then((result) => {
        return response.json({
          success: true,
          message: `Data user has been updated`,
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

exports.deleteUser = async (request, response) => {
  const id = request.params.id;
  const user = await userModel.findOne({ where: { id: id } });
  const oldCoverBook = user.foto;
  const pathCover = path.join(__dirname, `../foto_user`, oldCoverBook);

  if (fs.existsSync(pathCover)) {
    fs.unlink(pathCover, (error) => console.log(error));
  }

  userModel
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
