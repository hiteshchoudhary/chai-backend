import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
<<<<<<< HEAD
    try{
        res.status(200).json(
            new ApiResponse(200, "OK", {
                message: "Server is running",
                timestamp: new Date().toISOString(),
            })
        );
    } catch(error){
        throw new ApiError(500, error.message);
    }
=======
    res.status(200).json(
        new ApiResponse(200, "OK", {
            message: "Server is running",
            timestamp: new Date().toISOString(),
        })
    );
>>>>>>> e01ec568180c834198cff2b67aa9b0bb283c07c8
});

export {
    healthcheck
}
