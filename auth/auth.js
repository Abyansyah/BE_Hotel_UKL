const jsonwebtoken = require('jsonwebtoken');
require('dotenv').config();

const authVerify = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header == null) {
      return res.status(402).json({
        message: ' missing token',
        err: null,
      });
    }

    let token = header.split(' ')[1];
    const SECRET_KEY = process.env.SECRET_KEY;

    let decodedToken;
    try {
      decodedToken = await jsonwebtoken.verify(token, SECRET_KEY);
    } catch (error) {
      if (error instanceof jsonwebtoken.TokenExpiredError) {
        return res.status(401).json({
          message: 'token expired',
          err: error,
        });
      }
      return res.status(401).json({
        message: 'invalid token',
        err: error,
      });
    }

    req.userData = decodedToken;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Internal error',
      err: error,
    });
  }
};

module.exports = { authVerify };
