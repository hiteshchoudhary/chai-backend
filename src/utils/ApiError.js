<<<<<<< HEAD
class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

export {ApiError}
=======
// This is code is to make the errors consistent
// Throughout the project 

class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong ",
        errors = [],
        stack = ""
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null,
            this.message = message,
            this.success = false,
            this.errors = errors
            // Optimal 
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}


export { ApiError }
>>>>>>> myrepo/main
