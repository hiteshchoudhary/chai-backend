import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {deleteCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";







const generateAccessAndRefreshToken = async (ID) => {
    const user = await User.findById(ID)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = await refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken,refreshToken}
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password, role } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase(),
        role:role
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )


const loginUser = asyncHandler(async (req, res) => {
    // get email and password from user 
    // check in database  
    // password check
    // genrate access and refresh token
    // return res
    const {username, email, password} = req.body
    console.log(username, email, password);
    if (!username && !email) {
        throw new ApiError(400, "either enter email or username to login")
    }
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if (!existedUser) {
        throw new ApiError(400, "invalid username or email")
    }
    
    const checkPassword = await existedUser.isPasswordCorrect(password)

    if (!checkPassword) {
        throw new ApiError(400, "incoreect password")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(existedUser._id)

    const user = await User.findById(existedUser._id).select("-password -refreshToken")
    
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
            "user": user,
            "accessToken": accessToken,
            "refreshToken": refreshToken,
            },
            "user logged in success"
        )
    )
})

const logoutUser = asyncHandler(async (req,res) => {

    const loggedOutUser = await User.findByIdAndUpdate(req.author._id, 
        {
            $set:{
                refreshToken: null,
            },  
        },
        {
            new: true,
        }
).select("-password, -refreshToken")

const options = {
    httpOnly: true,
    secure: true,
}

 return res
 .status(200)
 .clearCookie("accessToken", options)
 .clearCookie("refreshToken", options)
 .json(
    new ApiResponse(
        200,
        {},
        "user logged out success"
    )
 )
})

const refreshToken = asyncHandler(async (req,res) => {
    // get the rt from user
    // if we get token verfiy by jwt
    // isvefied then 
   const comingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

   if (!comingRefreshToken) {
    throw new ApiError(400, "unautharized req")
   }

   const decodedToken = jwt.verify(comingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

   const user = await User.findById(decodedToken._id)

   if (!user) {
    throw new ApiError(400, "unautharized req")
   }

   if (comingRefreshToken !== user?.refreshToken) {
    throw new ApiError(400, "refresh token expired")
   }

   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

   const options= {
    httpOnly: true,
    secure: true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
    new ApiResponse(200, {accessToken, refreshToken}, "new refreshtoken success")
   )

})

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword, newPassword} = req.body
    console.log(oldPassword);
    
    if (!oldPassword && !email) {
        throw new ApiError(400, "password and email req")
    }

    const user = await User.findById(req?.author._id)

    const PasswordCorrection = user.isPasswordCorrect(oldPassword)

    if (!PasswordCorrection) {
        throw new ApiError(400, "incoreect password! please enter a valid coorect password")
    }

    user.password = newPassword
    user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, {"updatedPassword": newPassword}, "change password success"))

})

const getCurrentUser = asyncHandler(async (req,res) => {
    try {
        return res.status(200).json(new ApiResponse(200, {"deatis": req?.author}, "gureent user deatil success"))
    } catch (error) {
        throw new ApiError(400, "something went wrong while getting the current user")
    }
    
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email, username} = req.body

    if (!fullName && !email) {
        throw new ApiError(400, "all feilds req")
    }
    const user = await User.findByIdAndUpdate(req.author?._id,
        {
            $set:{
                fullName: fullName,
                email: email,
                username: username,
            }
        },

        {
            new: true,
        }
    ).select("-password")

    if (!user) {
        return new ApiError(400, "no user found ")
    }

    return res.status(200).json(new ApiResponse(200, {"updated details": user}, "accountdetails update success"))
})

const updateUserAvatar = asyncHandler(async (req,res) => {
        const avatarLocalPath = req.file?.path
        console.log(avatarLocalPath);
        
        if (!avatarLocalPath) {
            return new ApiError(400, "avater feild is required")
        }
    
        const avatar = await uploadOnCloudinary(avatarLocalPath)
    
        if (!avatar.url) {
            return new ApiError("error while upload on cloudinary")
        }
        // deleting old image
        const currentUser = await User.findById(req?.author._id)
    
        await deleteCloudinary(currentUser.avatar.url)
    
        if (!deleteCloudinary) {
            throw new ApiError(400, "error while deleting old avatar")
        }
    
        const user = await User.findByIdAndUpdate(req?.author._id,
            {
                $set:{
                    avatar: avatar.url,
                }
            },
            {
                new: true
            }
        ).select("-password")

    return res.status(200).json(new ApiResponse(200, {"updatedavatarImage": user},"avater update success"))
   
})

const updateUserCoverImage = asyncHandler(async (req,res) => {
    const coverImageLocalPath = req.file?.path
        console.log(coverImageLocalPath);
        
        if (!coverImageLocalPath) {
            return new ApiError(400, "avater feild is required")
        }
    
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
        if (!coverImage.url) {
            return new ApiError("error while upload on cloudinary")
        }
        // deleting old image
        const currentUser = await User.findById(req?.author._id)
    
        await deleteCloudinary(currentUser.coverImage.url)
    
        if (!deleteCloudinary) {
            throw new ApiError(400, "error while deleting old avatar")
        }
    
        const user = await User.findByIdAndUpdate(req?.author._id,
            {
                $set:{
                    coverImage: coverImage.url,
                }
            },
            {
                new: true
            }
        ).select("-password")

    return res.status(200).json(new ApiResponse(200, {"updatedCoverImage": user},"coverImage update success"))
   
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // getting the channel 
    const {username} = req.params

    if (!username) {
        throw new ApiError(200, "username is must field")
    }

    // get the user from db
    const channel = await User.aggregate([
        {
            $match:{
                username: username
            }
        },
        // getting the subscrribers of this channel
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },

        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers",
                },
                channelSubscribedToCount:{
                    $size : "$subscribedTo"
                },
                isSubscribed:{
                    $cond : {
                        if: {$in: [req.author?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName:1,
                email:1,
                avatar:1,
                isSubscribed:1,
                subscribersCount:1,
                channelSubscribedToCount:1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(400, "channel not found")
    }
    return res.status(200).json(200, {channel}, "user fetched success")
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req?.author._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owners",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owners"
                }
            }
        }
    ])
    return res.status(200).json( new ApiResponse(200, user[0].watchHistory, "watchhistory feched success"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}