class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
        // <400 because it is a success 

    }
}

// Status codes
// 2 xx→ success, include data.
// 4 xx→ client error, include errors array with details.
// 5 xx→ server error, usually generic message to avoid exposing internals.
// Keep status codes consistent with ApiError and ApiResponse classes.
// Use 422
// for validation errors, 400
// for generic bad requests.


export { ApiResponse }