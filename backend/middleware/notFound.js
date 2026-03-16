/**
 * 404 handler - no matching route.
 */
const notFound = (req, res, next) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

export default notFound;
