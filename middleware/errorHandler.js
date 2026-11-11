const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.code === 11000) {
    return res.status(409).json({ message: 'A book with this title already exists for this author' });
  }
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join('; ');
    return res.status(422).json({ message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${error.path}` });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body contains invalid JSON' });
  }

  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) console.error(error);
  return res.status(statusCode).json({
    message: statusCode >= 500 ? 'Internal server error' : error.message
  });
}

module.exports = { notFound, errorHandler };
