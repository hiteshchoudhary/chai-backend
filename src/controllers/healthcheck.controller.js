import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'ok',
        responsetime: process.hrtime(),
        timestamp: Date.now()
    };
    try {
        return res.status(200).json(
            new ApiResponse(
                200,
                healthCheck,
                "health is good"
            )
        )
    } catch (error) {
        console.error("Error in health check",error)
        healthCheck.message = error;
        throw new ApiError(
            503,
            " getting Error in health check time"
        ) 
    }

})

export {
    healthcheck
    }
    