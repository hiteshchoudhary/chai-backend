import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const authenticate = asyncHandler(async(req, _, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if(!token){
        throw new ApiError(401, "Unauthorize request");
    }

    const jwtData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(jwtData?._id).select("-password -refreshToken");

    if(!user){
        throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
})