export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = err.status || 500;
  let message = err.message || "Internal server error";

  // Map Prisma known request errors to stable HTTP responses.
  if (err?.code === "P2002") {
    status = 409;
    message = "Unique constraint violation";
  } else if (err?.code === "P2025") {
    status = 404;
    message = "Resource not found";
  } else if (err?.code === "P2003") {
    status = 400;
    message = "Invalid related resource";
  }

  return res.status(status).json({
    message,
  });
}
