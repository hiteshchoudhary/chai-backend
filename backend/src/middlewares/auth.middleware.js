import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'

const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(400, "invalid token")
        }
        const decodedInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedInfo._id)

        req.author = user
        next()

    } catch (error) {
        throw new ApiError(400, "something went wrong while logout the user", error)
        
    }
})

export {verifyJWT}