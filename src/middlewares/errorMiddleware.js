const errorHandler = (err, req, res, next) => {
  if (err.statusCode && err.success === false) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // For unexpected errors
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      message: err.message,
      stack: err.stack,
    }),
  });
};

export { errorHandler };
