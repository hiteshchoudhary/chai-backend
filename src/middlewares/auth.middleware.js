import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import JWT from 'jsonwebtoken'
import { User } from "../models/user.model.js";




export const verifyJWT = asyncHandler( async(req, _, next)=>{
    // req ke pass cookie ka access hai kiuki hamne hi to 
    // app.use(cookieparsar) pass kiya hai 

   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer",""); 
 
    if(!token){
     throw new ApiError(401, "Unauthorized request")
    }
 
    //if token has then checking jwt its token correct or not
 
    const decodedToken = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
    //if user not then 
    if(!user){
     throw new ApiError(401, "Invalid Access Token")
    }
 
    // if user has then 
    req.user = user
    next()
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
   }

})