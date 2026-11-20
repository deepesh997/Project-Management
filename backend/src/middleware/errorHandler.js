export function globalErrorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error with correlation ID
  console.error(`[Error] Request ${req.id || 'N/A'}: ${err.message}`, isProduction ? '' : err.stack);

  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 && isProduction ? 'An unexpected server error occurred.' : err.message,
      requestId: req.id,
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}
