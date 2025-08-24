import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = async (req, res,next) => {
    return res.status(200).json(
        new ApiResponse(200, "everthing fine")
    )
}

export {
    healthcheck
    }
    