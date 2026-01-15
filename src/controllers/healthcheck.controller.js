import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


/**
 * Healthcheck Controller
 * 
 * This endpoint is used to check if the server is running and healthy.
 * Returns a simple OK status with a success message.
 * Commonly used by monitoring tools, load balancers, and deployment pipelines.
 */
const healthcheck = asyncHandler(async (req, res) => {
    // Return a simple healthcheck response indicating the server is running
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    status: "OK",
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime()
                },
                "Server is healthy and running"
            )
        )
})

export {
    healthcheck
    }
    