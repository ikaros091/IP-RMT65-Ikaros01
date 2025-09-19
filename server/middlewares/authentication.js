const { verifyToken } = require('../helpers/jwt');

async function authentication(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      const err = new Error('Please login first');
      err.name = 'Unauthorized';
      throw err;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      const err = new Error('Please login first');
      err.name = 'Unauthorized';
      throw err;
    }

    const token = parts[1];

    let payload;
    try {
      payload = verifyToken(token);
    } catch (e) {
      const err = new Error('Please login first');
      err.name = 'Unauthorized';
      throw err;
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authentication;
