function errorHandler(err, req, res, next) {
  let status = 500;
  let message = 'Internal Server Error';

  switch (err.name) {
    case 'SequelizeUniqueConstraintError':
      status = 400;
      message = err.errors && err.errors[0] && err.errors[0].message ? err.errors[0].message : 'Unique constraint error';
      break;
    case 'SequelizeValidationError':
      status = 400;
      message = err.errors && err.errors.length ? err.errors.map(e => e.message).join(', ') : 'Validation error';
      break;
    case 'InvalidLogin':
      status = 401;
      message = 'Invalid email/password';
      break;
    case 'Unauthorized':
      status = 401;
      message = 'Please login first';
      break;
    case 'Forbidden':
      status = 403;
      message = 'You are not authorized';
      break;
    default:
      break;
  }

  res.status(status).json({ message });
}

module.exports = errorHandler;
