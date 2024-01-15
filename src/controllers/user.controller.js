import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinaary, deleteOnCloudinary} from '../utils/services/cloudinary.service.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import JWT from "jsonwebtoken";
import mongoose from "mongoose";
import fs from 'fs'

// access and refresh token genrate function
const generateAccessAndRefreshTokens =  async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // Assigning the refresh token to the user instance
        user.refreshToken = refreshToken;

        // Saving the user instance
        await user.save({validateBeforeSave: false}) 

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, " something went wrong while generating access and refresh token")
    }
}

//register user 
const registerUser = asyncHandler(async(req, res)=>{

    const {fullName, email, password,username} = req.body 

    //improved code
    let avatarLocalFile;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar[0]){
        avatarLocalFile = req.files.avatar[0].path;
    }else{
        // if avatat file not receive
        throw new ApiError(400, "Avatar file is required");
    }

    let coverImageLocalFile;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalFile = req.files.coverImage[0].path;
    }

    //upload in cloudinary
    const avatar = await uploadOnCloudinaary(avatarLocalFile);

    const coverImage = await uploadOnCloudinaary(coverImageLocalFile);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");

    }

    // store in database 
    const user = await User.create({
        fullName,
        avatar: {public_id:avatar?.public_id, url: avatar?.url}, 
        coverImage: {public_id: coverImage?.public_id, url: coverImage?.url},
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token 
    const userIsCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!userIsCreated){
        throw new ApiError(500, "something went wrong registring the user")
    }

    // retern the response 
    return res.status(201).json(
        new ApiResponse(200, userIsCreated, "user registered successfully!!")
    );

    }) 

// login user 
const loginUser = asyncHandler( async(req,res)=>{

    // generating access and refresh token 
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(req.user._id)

    //send in cookie
    const loggedInUser = await User.findById(req.user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    //return response 
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully!!"
        )
    )
   
})


// logout user 
const logoutUser = asyncHandler( async(req, res)=>{

    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    const {accessToken, refreshToken} = req.user;
    
    return res
    .status(200)
    .clearCookie("accessToken", accessToken, options)
    .clearCookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {}, //data we send empty bez we dont need
            "User logout in successfully!!"
        )
    )


})

// refresh access token 
const refreshAccessToken = asyncHandler( async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken ;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request");
    }

    
    
    try {
        const decodedToken = JWT.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET, 
        )
        
        const user  = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        // match token 
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
        // generating new refresh access token
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, 
                    refreshToken: newRefreshToken,
                },
                "Access Token Refresh successfully !!"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

//change password function
const changeCurrentPassword = asyncHandler( async(req, res)=>{
    console.log(req.body)
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    // check provided oldPassword is correct or not 
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
   if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid Password")
   }

   // set the password 
   user.password = newPassword;

   // save the password
   await user.save({validateBeforeSave: false})
   
   return res
   .status(200)
   .json(new ApiResponse(200,{},"Password Change Successfully!!"))
})

// get Current user 
const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully !!"
        )
    )
})

// update Account details
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName, email} = req.body;
    if(!fullName || !email){
        throw new ApiError(400, "All feilds are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },{new:true}).select("-password");
    
    return res
    .status(200)
    .json(new ApiResponse(
        200,{
            user
        },
        "Account Updated successfully !!"
    ))


    
})

// update user avatar 
const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file missing")
    }

    // delete privious avatar file on cloudinary
    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    const previousAvatar = user.avatar

    if (previousAvatar.public_id) {
        await deleteOnCloudinary(previousAvatar.public_id);
    }
    
    //upload in cloudinary and get a url file so
    const avatar = await uploadOnCloudinaary(avatarLocalPath);

    // check avatar
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar file in cloudinary")
    }

    // stote in database 
    user.avatar = { key: avatar?.public_id, url: avatar?.url };
    await user.save({ validateBeforeSave: false });
      
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar file updated successfully !!"
        )
    )
})

// update coverImage file
const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path;
    
    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file missing")
    }
// delete privious coverImage file on cloudinary
    const user = await User.findById(req.user?._id)
        .select("-password -refreshToken");

    const previousCoverImage = user.coverImage;
        if (previousCoverImage.public_id) {
            await deleteOnCloudinary(previousCoverImage.public_id);
    }  

    //upload in cloudinary and get a url file so
    const coverImage = await uploadOnCloudinaary(coverImageLocalPath);


    // check coverImage
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on coverImage file in cloudinary")
    }

    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "coverImage file updated successfully !!"
        )
    )
})

// get user Channel  profile function
const getUserChannelProfile = asyncHandler( async(req, res)=>{
    //getting data from url 
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }
    
    const channel =  await User.aggregate([
        // match the value 
        // pipeline stage 1
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        // stage 2 lookup all the sabscribers value
        {
            $lookup:{
                from:"subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // stage 3 loolup all the subscribe to value that user subscribed 
        {
            $lookup:{
                from:"subscriptions", // because its store in database lowercase and purals form
                 localField: "_id",
                 foreignField: "subscriber",
                 as: "subscribedTo"
            }
        },
        // stage 4 addfeilds and count value
        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                }, 
                //check user subscribed or not 
                isSubscriber: {
                    $cond: {
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        // stage 5 i want only selected value
        {
            $project:{
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                username: 1,
                email: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                createdAt: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "User channel does not exists")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            channel[0],
            "Channel fetched successfully!!"
        )
    )

})

// get watch history func
const getWatchHistory = asyncHandler(async(req,res)=>{
   const user =  await User.aggregate([
        //stage 1  matching id feild to object id of current user
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id) 
                // bez mongodb id a proper way like 'ObjectId('string')' but in aggregate function all code gose as a some so mongoose can't convert this so we convert like this kiuki hame req.user._id se string value recive hoti hai jo ki kafi nahi hai match karne ke liye  
            }
        },
        //stage 2 lookup from videos database to get all videos id in my users local feild
        {
           $lookup:{
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [ // adding another pipeline (nasted lookup)
                //stage 1 lookup from users
                {
                    $lookup:{
                        from: "users",
                        localField: "videoOwner",
                        foreignField: "_id",
                        as: "videoOwner",
                        pipeline:[ // this nested pipeline add the value that i need in videoOwner feild 
                            // stage 1 dont need all vlaue want only specific value
                            {
                                $project: {
                                    fullName: 1,
                                    avatar: 1,
                                    username: 1
                                }
                            }
                        ]
                    }
                },
                // stage 2 get data in object format
                {
                    $addFields: {
                        // i want overwrite the existing value thats why same name 
                        videoOwner:{
                            $arrayElemAt: ["$videoOwner", 0]
                        }
                    }
                }
                
               
            ]
           }
        },
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            " fetched watchHistory videos successfully !!"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}