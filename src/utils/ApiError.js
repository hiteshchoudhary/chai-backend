class ApiError extends Error {
    constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
) {
    super(); // Do not pass the `message` to the base Error class, to avoid it doen't get overwritten by the base Error.
    this.statusCode = statusCode;
    this.data = null;
    this.message = message; // Explicitly set the message property.
    this.success = false;
    this.errors = errors;

    if (stack) {
    this.stack = stack;
    } else {
    Error.captureStackTrace(this, this.constructor);
    }
}
}

<<<<<<< HEAD
export default ApiError;
=======
export default ApiError;
>>>>>>> e01ec568180c834198cff2b67aa9b0bb283c07c8
